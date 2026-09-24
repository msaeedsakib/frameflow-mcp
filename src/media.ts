import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname } from "node:path";
import { normalizePath } from "./paths";

const mimeTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".heic": "image/heic",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export function mimeTypeOf(path: string): string {
  const mime = mimeTypes[extname(path).toLowerCase()];
  if (!mime) throw new Error(`Unsupported file type: ${path}. Use one of ${Object.keys(mimeTypes).join(", ")}.`);
  return mime;
}

export type InlineMedia = { data: string; mimeType: string };

export async function readInlineMedia(input: string): Promise<InlineMedia> {
  const path = normalizePath(input);
  const mimeType = mimeTypeOf(path);
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch {
    throw new Error(`Cannot read ${path}.`);
  }
  return { data: bytes.toString("base64"), mimeType };
}

export async function writeOutput(input: string, bytes: Uint8Array): Promise<{ path: string; bytes: number }> {
  const path = normalizePath(input);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
  return { path, bytes: bytes.byteLength };
}

export const extensionFor = (mimeType: string): string =>
  Object.entries(mimeTypes).find(([, mime]) => mime === mimeType)?.[0] ?? "";
