import type { Client } from "../clients";
import { readInlineMedia } from "../media";

export type VoiceRequest = {
  name: string;
  description?: string;
  sample_path?: string;
  consent_path?: string;
};

export async function createVoice(client: Client, request: VoiceRequest) {
  const ai = await client();
  const replicate = request.sample_path || request.consent_path;
  if (replicate && !(request.sample_path && request.consent_path)) {
    throw new Error("Voice replication needs both sample_path and consent_path.");
  }
  if (!replicate && !request.description) throw new Error("Provide a description (voice design) or sample_path + consent_path (voice replication).");
  const voice = replicate
    ? {
        type: "replicated" as const,
        display_name: request.name,
        replicated: {
          source_audio: await audio(request.sample_path ?? ""),
          consent_audio: await audio(request.consent_path ?? ""),
        },
      }
    : { type: "prompted" as const, display_name: request.name, prompted: { input: request.description ?? "" } };
  const created = await ai.voices.create({ store: true, voice });
  return { voice_id: created.id ?? created.key, name: created.display_name ?? request.name, type: created.type, expires_at: created.expire_time };
}

async function audio(path: string) {
  const media = await readInlineMedia(path);
  return { data: media.data, mime_type: media.mimeType };
}

export async function listVoices(client: Client) {
  const ai = await client();
  const response = await ai.voices.list();
  return (response.voices ?? []).map((voice) => ({
    voice_id: voice.id ?? voice.key ?? voice.display_name,
    name: voice.display_name,
    type: voice.type,
    description: voice.description,
    gender: voice.gender,
    language: voice.language_code,
    expires_at: voice.expire_time,
  }));
}
