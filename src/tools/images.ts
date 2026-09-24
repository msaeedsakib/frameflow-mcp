import type { ClientFor } from "../clients";
import { extensionFor, readInlineMedia, writeOutput } from "../media";
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
      mime_type: "image/jpeg",
      aspect_ratio: request.aspect_ratio,
      image_size: request.image_size,
    },
  });
  const image = interaction.output_image;
  if (!image?.data) {
    throw new Error(interaction.output_text ? `No image returned. Model said: ${interaction.output_text}` : "No image returned.");
  }
  const extension = image.mime_type ? extensionFor(image.mime_type) : "";
  const target = extension ? request.output_path.replace(/\.[A-Za-z0-9]+$/, "") + extension : request.output_path;
  const written = await writeOutput(target, Buffer.from(image.data, "base64"));
  return { ...written, model: model.id, mime_type: image.mime_type, text: interaction.output_text || undefined };
}
