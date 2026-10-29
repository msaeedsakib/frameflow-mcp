import type { Client } from "../clients";
import { inlinePart, pollInteraction, uploadVideo } from "../interactions";
import type { JobPoll } from "../jobs";
import { mimeTypeOf, type InlineMedia } from "../media";
import type { Model } from "../models";
import { normalizePath } from "../paths";
import type { VideoOptions } from "./schemas";

type Task = "text_to_video" | "image_to_video" | "reference_to_video" | "edit" | "extend";

export type VideoRequest = VideoOptions & {
  prompt: string;
  task: Task;
  images?: InlineMedia[];
  video_path?: string;
};

export async function submitVideo(client: Client, model: Model, request: VideoRequest): Promise<JobPoll> {
  const ai = await client();
  const videoUri = request.video_path ? await uploadVideo(ai, request.video_path, mimeTypeOf(normalizePath(request.video_path))) : undefined;
  const interaction = await ai.interactions.create({
    model: model.id,
    background: true,
    input: [
      ...(videoUri ? [{ type: "video" as const, uri: videoUri }] : []),
      ...(request.images ?? []).map((image) => inlinePart(image, "image")),
      { type: "text", text: request.prompt },
    ],
    response_format: {
      type: "video",
      aspect_ratio: request.aspect_ratio,
      resolution: request.resolution,
      duration: request.duration_seconds ? `${request.duration_seconds}s` : undefined,
    },
    generation_config: { video_config: { task: request.task } },
  });
  return pollInteraction(
    ai,
    interaction.id,
    (current) => (current.output_video ? { data: current.output_video.data, uri: current.output_video.uri, mimeType: current.output_video.mime_type } : undefined),
    "video",
  );
}
