import type { ClientFor } from "../clients";
import type { JobPoll } from "../jobs";
import { type InlineMedia } from "../media";
import type { Model } from "../models";
import type { VideoOptions } from "./schemas";

type Task = "text_to_video" | "image_to_video" | "reference_to_video" | "edit" | "extend";

export type OmniRequest = VideoOptions & {
  prompt: string;
  task: Task;
  images?: InlineMedia[];
  video?: InlineMedia;
};

const part = (media: InlineMedia, type: "image" | "video") => ({ type, data: media.data, mime_type: media.mimeType });

export async function submitOmni(clientFor: ClientFor, model: Model, request: OmniRequest): Promise<JobPoll> {
  const ai = await clientFor(model.location);
  const interaction = await ai.interactions.create({
    model: model.id,
    background: true,
    input: [
      ...(request.video ? [part(request.video, "video")] : []),
      ...(request.images ?? []).map((image) => part(image, "image")),
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
  return async () => {
    const current = await ai.interactions.get(interaction.id);
    if (current.status === "completed") {
      const video = current.output_video;
      if (!video) throw new Error(current.output_text ? `No video returned. Model said: ${current.output_text}` : "No video returned.");
      return { done: true, media: { data: video.data, uri: video.uri, mimeType: video.mime_type } };
    }
    if (["failed", "cancelled", "incomplete", "budget_exceeded"].includes(current.status)) {
      const detail = current.errors?.map((error) => error.message).join("; ");
      throw new Error(`Video generation ${current.status}${detail ? `: ${detail}` : ""}.`);
    }
    return { done: false };
  };
}
