import { VideoGenerationReferenceType, type GenerateVideosOperation } from "@google/genai";
import type { ClientFor } from "../clients";
import type { JobPoll } from "../jobs";
import type { InlineMedia } from "../media";
import type { Model } from "../models";
import type { VideoOptions } from "./schemas";

export type VeoRequest = VideoOptions & {
  prompt: string;
  first_frame?: InlineMedia;
  last_frame?: InlineMedia;
  references?: InlineMedia[];
};

const image = (media: InlineMedia) => ({ imageBytes: media.data, mimeType: media.mimeType });

export async function submitVeo(clientFor: ClientFor, model: Model, request: VeoRequest): Promise<JobPoll> {
  const ai = await clientFor(model.location);
  let operation: GenerateVideosOperation = await ai.models.generateVideos({
    model: model.id,
    source: { prompt: request.prompt, image: request.first_frame ? image(request.first_frame) : undefined },
    config: {
      numberOfVideos: 1,
      aspectRatio: request.aspect_ratio,
      resolution: request.resolution,
      durationSeconds: request.duration_seconds,
      generateAudio: request.generate_audio,
      negativePrompt: request.negative_prompt,
      lastFrame: request.last_frame ? image(request.last_frame) : undefined,
      referenceImages: request.references?.map((reference) => ({
        image: image(reference),
        referenceType: VideoGenerationReferenceType.ASSET,
      })),
    },
  });
  return async () => {
    operation = await ai.operations.getVideosOperation({ operation });
    if (!operation.done) return { done: false };
    if (operation.error) throw new Error(`Video generation failed: ${JSON.stringify(operation.error)}`);
    const video = operation.response?.generatedVideos?.[0]?.video;
    if (!video) {
      const reasons = operation.response?.raiMediaFilteredReasons?.join("; ");
      throw new Error(reasons ? `Video was filtered: ${reasons}` : "No video returned.");
    }
    return { done: true, media: { data: video.videoBytes, uri: video.uri, mimeType: video.mimeType } };
  };
}
