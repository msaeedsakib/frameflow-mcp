import type { ClientFor } from "../clients";
import { extensionFor, readInlineMedia, writeOutput } from "../media";
import { type Model } from "../models";
import type { ImageOptions } from "./schemas";

type ImageRequest = ImageOptions & { prompt: string; output_path: string; reference_image_paths?: string[] };

export async function generateImage(clientFor: ClientFor, model: Model, request: ImageRequest) {
  const ai = await clientFor(model.location);
  const references = await Promise.all((request.reference_image_paths ?? []).map(readInlineMedia));
  const response = await ai.models.generateContent({
    model: model.id,
    contents: [
      ...references.map((image) => ({ inlineData: { data: image.data, mimeType: image.mimeType } })),
      { text: request.prompt },
    ],
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: request.aspect_ratio, imageSize: request.image_size },
    },
  });
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const image = parts.find((part) => part.inlineData?.data)?.inlineData;
  const text = parts.map((part) => part.text ?? "").join("").trim();
  if (!image?.data) {
    const reason = response.candidates?.[0]?.finishReason ?? response.promptFeedback?.blockReason;
    throw new Error(`No image returned${reason ? ` (${reason})` : ""}${text ? `. Model said: ${text}` : "."}`);
  }
  const extension = image.mimeType ? extensionFor(image.mimeType) : "";
  const target = extension ? request.output_path.replace(/\.[A-Za-z0-9]+$/, "") + extension : request.output_path;
  const written = await writeOutput(target, Buffer.from(image.data, "base64"));
  return { ...written, model: model.id, mime_type: image.mimeType, text: text || undefined };
}
