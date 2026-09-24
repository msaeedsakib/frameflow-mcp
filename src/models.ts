export const generatingTools = [
  "generate_image",
  "edit_image",
  "generate_video",
  "animate_image",
  "generate_video_from_references",
  "extend_video",
  "edit_video",
] as const;

export type ToolName = (typeof generatingTools)[number];

export type Family = "nano-banana" | "omni" | "veo";

type ModelSpec = {
  id: string;
  family: Family;
  location: string;
  label: string;
  tools: readonly ToolName[];
};

const imageTools = ["generate_image", "edit_image"] as const;
const omniVideoTools = ["generate_video", "animate_image", "generate_video_from_references", "extend_video", "edit_video"] as const;
const veoVideoTools = ["generate_video", "animate_image", "generate_video_from_references"] as const;

export const models = [
  { id: "gemini-3.1-flash-image", family: "nano-banana", location: "global", label: "Nano Banana 2", tools: imageTools },
  { id: "gemini-3-pro-image", family: "nano-banana", location: "global", label: "Nano Banana Pro", tools: imageTools },
  { id: "gemini-3.1-flash-lite-image", family: "nano-banana", location: "global", label: "Nano Banana 2 Lite", tools: imageTools },
  { id: "gemini-omni-1.1-flash", family: "omni", location: "global", label: "Gemini Omni 1.1 Flash", tools: omniVideoTools },
  { id: "veo-3.1-generate-001", family: "veo", location: "us-central1", label: "Veo 3.1", tools: veoVideoTools },
  { id: "veo-3.1-fast-generate-001", family: "veo", location: "us-central1", label: "Veo 3.1 Fast", tools: veoVideoTools },
  { id: "veo-3.1-lite-generate-preview", family: "veo", location: "us-central1", label: "Veo 3.1 Lite", tools: veoVideoTools },
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
