import type { Client } from "../clients";
import { noOutput } from "../interactions";
import { withExtensionFor, writeOutput } from "../media";
import type { Model } from "../models";

export type SpeechTurn = { speaker: string; text: string; style?: string };

export type SpeechRequest = {
  output_path: string;
  text?: string;
  voice?: string;
  style?: string;
  turns?: SpeechTurn[];
  voices?: Record<string, string>;
};

export const isCustomVoice = (voice: string) => /^voice(key)?_/.test(voice);

const annotation = (style: string | undefined, speaker?: string) =>
  style || speaker ? [{ type: "speech_metadata" as const, style, speaker }] : undefined;

export function buildSpeech(request: SpeechRequest) {
  if (request.turns?.length) {
    const speakers = [...new Set(request.turns.map((turn) => turn.speaker))];
    if (speakers.length > 2) throw new Error(`At most 2 speakers per request; got ${speakers.join(", ")}.`);
    const voices = request.voices ?? {};
    const missing = speakers.filter((speaker) => !voices[speaker]);
    if (missing.length) throw new Error(`No voice given for speaker(s) ${missing.join(", ")}. Pass voices: { "${missing[0]}": "Kore" }.`);
    const custom = speakers.filter((speaker) => isCustomVoice(voices[speaker] ?? ""));
    if (custom.length) throw new Error(`Multi-speaker requests support prebuilt voices only; ${custom.join(", ")} use custom voices. Synthesize each turn separately with text + voice and concatenate.`);
    return {
      input: request.turns.map((turn) => ({ type: "text" as const, text: turn.text, annotations: annotation(turn.style ?? request.style, turn.speaker) })),
      speech_config: { speakers: speakers.map((speaker) => ({ speaker, voice: voices[speaker] })) },
    };
  }
  if (!request.text) throw new Error("Provide text (single speaker) or turns (dialogue).");
  if (!request.voice) throw new Error("Provide a voice: a prebuilt name like Kore or a custom voice_... id from list_voices.");
  return {
    input: [{ type: "text" as const, text: request.text, annotations: annotation(request.style) }],
    speech_config: [{ voice: request.voice }],
  };
}

export async function generateSpeech(client: Client, model: Model, request: SpeechRequest) {
  const { input, speech_config } = buildSpeech(request);
  const ai = await client();
  const interaction = await ai.interactions.create({
    model: model.id,
    input,
    response_format: { type: "audio", mime_type: "audio/wav" },
    generation_config: { speech_config },
  });
  const audio = interaction.output_audio;
  if (!audio?.data) throw noOutput(interaction, "audio");
  const written = await writeOutput(withExtensionFor(request.output_path, audio.mime_type ?? "audio/wav"), Buffer.from(audio.data, "base64"));
  return { ...written, model: model.id, mime_type: audio.mime_type };
}
