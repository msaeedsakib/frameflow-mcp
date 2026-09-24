import type { ClientFor } from "../clients";
import { readInlineMedia, writeOutput } from "../media";
import { type Model } from "../models";
import type { ImageOptions } from "./schemas";

type ImageRequest = ImageOptions & { prompt: string; output_path: string; reference_image_paths?: string[] };

export async function generateImage(clientFor: ClientFor, model: Model, request: ImageRequest) {
  const ai = await clientFor(model.location);
  const references = await Promise.all((request.reference_image_paths ?? []).map(readInlineMedia));
  const interaction = await ai.interactions.create({
    model: model.id,
    input: [
      ...references.map((image) => ({ type: "image" as const, data: image.data, mime_type: image.mimeType })),
      { type: "text" as const, text: request.prompt },
    ],
    response_format: {
      type: "image",
      mime_type: "image/png",
      aspect_ratio: request.aspect_ratio,
      image_size: request.image_size,
    },
  });
  const image = interaction.output_image;
  if (!image?.data) {
    throw new Error(interaction.output_text ? `No image returned. Model said: ${interaction.output_text}` : "No image returned.");
  }
  const written = await writeOutput(request.output_path, Buffer.from(image.data, "base64"));
  return { ...written, model: model.id, mime_type: image.mime_type, text: interaction.output_text || undefined };
}
