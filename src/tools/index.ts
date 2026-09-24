import type { CallToolResult, McpServer } from "@modelcontextprotocol/server";
import type { ClientFor } from "../clients";
import { defaultModelFor, loadConfig, setDefaultModel } from "../config";
import type { JobPoll, Jobs } from "../jobs";
import { readInlineMedia } from "../media";
import { allowedModelsFor, generatingTools, modelById, type Model, type ToolName } from "../models";
import * as descriptions from "./descriptions";
import { generateImage } from "./images";
import * as schemas from "./schemas";
import { submitOmni, type OmniRequest } from "./video-omni";
import { submitVeo, type VeoRequest } from "./video-veo";

const readOnly = { readOnlyHint: true, openWorldHint: false };
const generating = { readOnlyHint: false, destructiveHint: false, openWorldHint: true };

async function respond(name: string, run: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return { content: [{ type: "text", text: JSON.stringify(await run(), null, 2) }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { content: [{ type: "text", text: JSON.stringify({ error: `Failed to execute tool '${name}': ${message}` }) }], isError: true };
  }
}

async function resolveModel(tool: ToolName, requested: string | undefined): Promise<Model> {
  const id = requested ?? (await defaultModelFor(tool));
  if (!id) throw new Error(`No model given and no default set for ${tool}. Call set_default_model first (see list_models).`);
  const allowed = allowedModelsFor(tool);
  if (!allowed.includes(id as (typeof allowed)[number])) throw new Error(`${id} is not valid for ${tool}. Allowed: ${allowed.join(", ")}.`);
  return modelById(id);
}

export function registerTools(server: McpServer, clientFor: ClientFor, jobs: Jobs): void {
  const submitVideo = async (
    tool: ToolName,
    input: { model?: string; output_path: string },
    build: (model: Model) => Promise<JobPoll>,
  ) => {
    const model = await resolveModel(tool, input.model);
    const poll = await build(model);
    return jobs.create({ tool, model: model.id, output_path: input.output_path, poll });
  };

  const dispatch = (model: Model, omni: OmniRequest, veo: VeoRequest) =>
    model.family === "omni" ? submitOmni(clientFor, model, omni) : submitVeo(clientFor, model, veo);

  server.registerTool(
    "list_models",
    { description: descriptions.listModels, inputSchema: schemas.listModelsInput, annotations: readOnly },
    () =>
      respond("list_models", async () => {
        const { defaults } = await loadConfig();
        return generatingTools.map((tool) => ({ tool, allowed: allowedModelsFor(tool), default: defaults[tool] ?? null }));
      }),
  );

  server.registerTool(
    "set_default_model",
    { description: descriptions.setDefaultModel, inputSchema: schemas.setDefaultModelInput, annotations: { readOnlyHint: false, openWorldHint: false } },
    ({ tool, model }) =>
      respond("set_default_model", async () => {
        const allowed = allowedModelsFor(tool);
        const id = allowed.find((candidate) => candidate === model);
        if (!id) throw new Error(`${model} is not valid for ${tool}. Allowed: ${allowed.join(", ")}.`);
        return (await setDefaultModel(tool, id)).defaults;
      }),
  );

  server.registerTool(
    "generate_image",
    { description: descriptions.generateImage, inputSchema: schemas.generateImageInput, annotations: generating },
    (input) => respond("generate_image", async () => generateImage(clientFor, await resolveModel("generate_image", input.model), input)),
  );

  server.registerTool(
    "edit_image",
    { description: descriptions.editImage, inputSchema: schemas.editImageInput, annotations: generating },
    (input) => respond("edit_image", async () => generateImage(clientFor, await resolveModel("edit_image", input.model), input)),
  );

  server.registerTool(
    "generate_video",
    { description: descriptions.generateVideo, inputSchema: schemas.generateVideoInput, annotations: generating },
    (input) =>
      respond("generate_video", () =>
        submitVideo("generate_video", input, (model) => dispatch(model, { ...input, task: "text_to_video" }, input)),
      ),
  );

  server.registerTool(
    "animate_image",
    { description: descriptions.animateImage, inputSchema: schemas.animateImageInput, annotations: generating },
    (input) =>
      respond("animate_image", () =>
        submitVideo("animate_image", input, async (model) => {
          const first = await readInlineMedia(input.image_path);
          return dispatch(model, { ...input, task: "image_to_video", images: [first] }, { ...input, first_frame: first });
        }),
      ),
  );

  server.registerTool(
    "generate_video_from_references",
    { description: descriptions.generateVideoFromReferences, inputSchema: schemas.generateVideoFromReferencesInput, annotations: generating },
    (input) =>
      respond("generate_video_from_references", () =>
        submitVideo("generate_video_from_references", input, async (model) => {
          const references = await Promise.all((input.reference_image_paths ?? []).map(readInlineMedia));
          const first = input.first_frame_path ? await readInlineMedia(input.first_frame_path) : undefined;
          const last = input.last_frame_path ? await readInlineMedia(input.last_frame_path) : undefined;
          const frames = [first, last].filter((frame) => frame !== undefined);
          return dispatch(
            model,
            { ...input, task: references.length ? "reference_to_video" : "image_to_video", images: [...frames, ...references] },
            { ...input, first_frame: first, last_frame: last, references: references.length ? references : undefined },
          );
        }),
      ),
  );

  server.registerTool(
    "extend_video",
    { description: descriptions.extendVideo, inputSchema: schemas.extendVideoInput, annotations: generating },
    (input) =>
      respond("extend_video", () =>
        submitVideo("extend_video", input, async (model) =>
          submitOmni(clientFor, model, { ...input, task: "extend", video: await readInlineMedia(input.video_path) }),
        ),
      ),
  );

  server.registerTool(
    "edit_video",
    { description: descriptions.editVideo, inputSchema: schemas.editVideoInput, annotations: generating },
    (input) =>
      respond("edit_video", () =>
        submitVideo("edit_video", input, async (model) =>
          submitOmni(clientFor, model, { ...input, task: "edit", video: await readInlineMedia(input.video_path) }),
        ),
      ),
  );

  server.registerTool(
    "get_video_job",
    { description: descriptions.getVideoJob, inputSchema: schemas.getVideoJobInput, annotations: readOnly },
    ({ job_id }) => respond("get_video_job", () => jobs.check(job_id)),
  );
}
