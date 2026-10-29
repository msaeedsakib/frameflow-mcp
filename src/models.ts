export const generatingTools = [
  "generate_image",
  "generate_video",
  "animate_image",
  "generate_video_from_references",
  "extend_video",
  "edit_video",
  "generate_speech",
  "generate_music",
] as const;

export type ToolName = (typeof generatingTools)[number];

export type Family = "image" | "video" | "speech" | "music";

type ModelSpec = {
  id: string;
  family: Family;
  label: string;
  tools: readonly ToolName[];
};

const imageTools = ["generate_image"] as const;
const videoTools = ["generate_video", "animate_image", "generate_video_from_references", "extend_video", "edit_video"] as const;
const speechTools = ["generate_speech"] as const;
const musicTools = ["generate_music"] as const;

export const models = [
  { id: "gemini-nano-banana-2.1", family: "image", label: "Nano Banana 2.1", tools: imageTools },
  { id: "gemini-3.1-flash-image", family: "image", label: "Nano Banana 2", tools: imageTools },
  { id: "gemini-3-pro-image", family: "image", label: "Nano Banana Pro", tools: imageTools },
  { id: "gemini-3.1-flash-lite-image", family: "image", label: "Nano Banana 2 Lite", tools: imageTools },
  { id: "gemini-omni-1.1-flash", family: "video", label: "Gemini Omni 1.1 Flash", tools: videoTools },
  { id: "gemini-3.8-flash-tts", family: "speech", label: "Gemini 3.8 Flash TTS", tools: speechTools },
  { id: "gemini-3.8-flash-lite-tts", family: "speech", label: "Gemini 3.8 Flash-Lite TTS", tools: speechTools },
  { id: "lyria-3.5", family: "music", label: "Lyria 3.5 (full songs)", tools: musicTools },
  { id: "lyria-3-clip-preview", family: "music", label: "Lyria 3 Clip (30 s)", tools: musicTools },
] as const satisfies readonly ModelSpec[];

export type ModelId = (typeof models)[number]["id"];
export type Model = (typeof models)[number];

export function allowedModelsFor(tool: ToolName): [ModelId, ...ModelId[]] {
  const ids = models.filter((model) => (model.tools as readonly ToolName[]).includes(tool)).map((model) => model.id);
  const [first, ...rest] = ids;
  if (!first) throw new Error(`No models registered for ${tool}.`);
  return [first, ...rest];
}

export function modelById(id: string): Model {
  const model = models.find((candidate) => candidate.id === id);
  if (!model) throw new Error(`Unknown model ${id}.`);
  return model;
}
