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
  use: string;
  tools: readonly ToolName[];
};

const imageTools = ["generate_image"] as const;
const videoTools = ["generate_video", "animate_image", "generate_video_from_references", "extend_video", "edit_video"] as const;
const speechTools = ["generate_speech"] as const;
const musicTools = ["generate_music"] as const;

export const models = [
  { id: "gemini-nano-banana-2.1", family: "image", label: "Nano Banana 2.1", use: "best general-purpose image model", tools: imageTools },
  { id: "gemini-3.1-flash-image", family: "image", label: "Nano Banana 2", use: "fast general-purpose images", tools: imageTools },
  { id: "gemini-3-pro-image", family: "image", label: "Nano Banana Pro", use: "exact logos, text-heavy or complex compositions", tools: imageTools },
  { id: "gemini-3.1-flash-lite-image", family: "image", label: "Nano Banana 2 Lite", use: "cheap drafts, 1K only", tools: imageTools },
  { id: "gemini-omni-1.1-flash", family: "video", label: "Gemini Omni 1.1 Flash", use: "video with native audio", tools: videoTools },
  { id: "gemini-3.8-flash-tts", family: "speech", label: "Gemini 3.8 Flash TTS", use: "natural, expressive speech", tools: speechTools },
  { id: "gemini-3.8-flash-lite-tts", family: "speech", label: "Gemini 3.8 Flash-Lite TTS", use: "bulk or cheap narration", tools: speechTools },
  { id: "lyria-3.5", family: "music", label: "Lyria 3.5", use: "full songs of a couple of minutes", tools: musicTools },
  { id: "lyria-3-clip-preview", family: "music", label: "Lyria 3 Clip", use: "always a 30-second clip: jingles, loops, stings", tools: musicTools },
] as const satisfies readonly ModelSpec[];

export type ModelId = (typeof models)[number]["id"];
export type Model = (typeof models)[number];

const videoDefault = "gemini-omni-1.1-flash";

export const defaultModels = {
  generate_image: "gemini-nano-banana-2.1",
  generate_video: videoDefault,
  animate_image: videoDefault,
  generate_video_from_references: videoDefault,
  extend_video: videoDefault,
  edit_video: videoDefault,
  generate_speech: "gemini-3.8-flash-tts",
  generate_music: "lyria-3.5",
} as const satisfies Record<ToolName, ModelId>;

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
