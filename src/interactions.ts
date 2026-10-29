import type { GoogleGenAI } from "@google/genai";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { JobMedia, JobPoll } from "./jobs";
import type { InlineMedia } from "./media";
import { normalizePath } from "./paths";

type Interaction = Extract<Awaited<ReturnType<GoogleGenAI["interactions"]["get"]>>, { status: unknown }>;

const terminal = ["failed", "cancelled", "incomplete", "budget_exceeded"];

export const inlinePart = (media: InlineMedia, type: "image" | "video" | "audio") => ({ type, data: media.data, mime_type: media.mimeType });

export function failureOf(interaction: Interaction, what: string): Error | undefined {
  if (!terminal.includes(interaction.status)) return undefined;
  const detail = interaction.errors?.map((error) => error.message).join("; ");
  return new Error(`${what} ${interaction.status}${detail ? `: ${detail}` : ""}.`);
}

export function noOutput(interaction: Interaction, what: string): Error {
  return new Error(interaction.output_text ? `No ${what} returned. Model said: ${interaction.output_text}` : `No ${what} returned.`);
}

export function pollInteraction(ai: GoogleGenAI, id: string, pick: (interaction: Interaction) => JobMedia | undefined, what: string): JobPoll {
  return async () => {
    const current = await ai.interactions.get(id);
    if (current.status === "completed") {
      const media = pick(current);
      if (!media) throw noOutput(current, what);
      return { done: true, media };
    }
    const failure = failureOf(current, `${what} generation`);
    if (failure) throw failure;
    return { done: false };
  };
}

export async function uploadVideo(ai: GoogleGenAI, inputPath: string, mimeType: string): Promise<string> {
  const path = normalizePath(inputPath);
  let file = await ai.files.upload({ file: path, config: { mimeType } });
  while (file.state === "PROCESSING") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (!file.name) break;
    file = await ai.files.get({ name: file.name });
  }
  if (file.state === "FAILED") throw new Error(`Upload of ${path} failed${file.error?.message ? `: ${file.error.message}` : ""}.`);
  if (!file.uri) throw new Error(`Upload of ${path} returned no uri.`);
  return file.uri;
}

export async function downloadFile(ai: GoogleGenAI, uri: string): Promise<Uint8Array> {
  const name = uri.replace(/^.*?(files\/[^/?]+).*$/, "$1");
  const downloadPath = join(tmpdir(), `frameflow-${name.replace("/", "-")}-${Date.now()}`);
  await ai.files.download({ file: name, downloadPath });
  try {
    return new Uint8Array(await readFile(downloadPath));
  } finally {
    await rm(downloadPath, { force: true });
  }
}
