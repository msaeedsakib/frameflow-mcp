import type { Client } from "../clients";
import { inlinePart, pollInteraction } from "../interactions";
import type { JobPoll } from "../jobs";
import { readInlineMedia } from "../media";
import type { Model } from "../models";

export type MusicRequest = {
  prompt: string;
  format?: "wav" | "mp3";
  reference_image_paths?: string[];
};

export async function submitMusic(client: Client, model: Model, request: MusicRequest): Promise<JobPoll> {
  const ai = await client();
  const references = await Promise.all((request.reference_image_paths ?? []).map(readInlineMedia));
  const interaction = await ai.interactions.create({
    model: model.id,
    background: true,
    input: [...references.map((image) => inlinePart(image, "image")), { type: "text", text: request.prompt }],
    response_format: { type: "audio", mime_type: request.format === "mp3" ? "audio/mp3" : "audio/wav" },
  });
  return pollInteraction(
    ai,
    interaction.id,
    (current) =>
      current.output_audio
        ? { data: current.output_audio.data, uri: current.output_audio.uri, mimeType: current.output_audio.mime_type, text: current.output_text || undefined }
        : undefined,
    "music",
  );
}
