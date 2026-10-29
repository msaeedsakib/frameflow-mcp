import type { Client } from "../clients";
import { noOutput } from "../interactions";
import { readInlineMedia, withExtensionFor, writeOutput } from "../media";
import type { Model } from "../models";
import type { ImageOptions } from "./schemas";

type ImageRequest = ImageOptions & { prompt: string; output_path: string; reference_image_paths?: string[] };

export async function generateImage(client: Client, model: Model, request: ImageRequest) {
  const ai = await client();
  const references = await Promise.all((request.reference_image_paths ?? []).map(readInlineMedia));
  const interaction = await ai.interactions.create({
    model: model.id,
    input: [
      ...references.map((image) => ({ type: "image" as const, data: image.data, mime_type: image.mimeType })),
      { type: "text" as const, text: request.prompt },
    ],
    response_format: {
      type: "image",
      aspect_ratio: request.aspect_ratio,
      image_size: request.image_size,
    },
  });
  const image = interaction.output_image;
  if (!image?.data) throw noOutput(interaction, "image");
  const written = await writeOutput(withExtensionFor(request.output_path, image.mime_type), Buffer.from(image.data, "base64"));
  return { ...written, model: model.id, mime_type: image.mime_type, text: interaction.output_text || undefined };
}
