import type { CallToolResult, McpServer } from "@modelcontextprotocol/server";
import type { Client } from "../clients";
import { explain } from "../errors";
import type { JobPoll, Jobs } from "../jobs";
import { readInlineMedia } from "../media";
import { defaultModels, generatingTools, modelById, models, type Model, type ModelId, type ToolName } from "../models";
import * as descriptions from "./descriptions";
import { generateImage } from "./images";
import { submitMusic } from "./music";
import * as schemas from "./schemas";
import { generateSpeech } from "./speech";
import { submitVideo } from "./video";
import { createVoice, listVoices } from "./voices";

const readOnly = { readOnlyHint: true, openWorldHint: false };
const generating = { readOnlyHint: false, destructiveHint: false, openWorldHint: true };

async function respond(name: string, run: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return { content: [{ type: "text", text: JSON.stringify(await run(), null, 2) }] };
  } catch (error) {
    const message = explain(error);
    return { content: [{ type: "text", text: JSON.stringify({ error: `Failed to execute tool '${name}': ${message}` }) }], isError: true };
  }
}

const resolveModel = (tool: ToolName, requested: ModelId | undefined): Model => modelById(requested ?? defaultModels[tool]);

export function registerTools(server: McpServer, client: Client, jobs: Jobs): void {
  const submitJob = async (tool: ToolName, input: { model?: ModelId; output_path: string }, build: (model: Model) => Promise<JobPoll>) => {
    const model = resolveModel(tool, input.model);
    const poll = await build(model);
    return jobs.create({ tool, model: model.id, output_path: input.output_path, poll });
  };

  server.registerTool(
    "list_models",
    { description: descriptions.listModels, inputSchema: schemas.listModelsInput, annotations: readOnly },
    () =>
      respond("list_models", async () =>
        generatingTools.map((tool) => ({
          tool,
          default: defaultModels[tool],
          models: models.filter((model) => (model.tools as readonly ToolName[]).includes(tool)).map(({ id, label, use }) => ({ id, label, use })),
        })),
      ),
  );

  server.registerTool(
    "generate_image",
    { description: descriptions.generateImage, inputSchema: schemas.generateImageInput, annotations: generating },
    (input) => respond("generate_image", () => generateImage(client, resolveModel("generate_image", input.model), input)),
  );

  server.registerTool(
    "generate_video",
    { description: descriptions.generateVideo, inputSchema: schemas.generateVideoInput, annotations: generating },
    (input) => respond("generate_video", () => submitJob("generate_video", input, (model) => submitVideo(client, model, { ...input, task: "text_to_video" }))),
  );

  server.registerTool(
    "animate_image",
    { description: descriptions.animateImage, inputSchema: schemas.animateImageInput, annotations: generating },
    (input) =>
      respond("animate_image", () =>
        submitJob("animate_image", input, async (model) =>
          submitVideo(client, model, { ...input, task: "image_to_video", images: [await readInlineMedia(input.image_path)] }),
        ),
      ),
  );

  server.registerTool(
    "generate_video_from_references",
    { description: descriptions.generateVideoFromReferences, inputSchema: schemas.generateVideoFromReferencesInput, annotations: generating },
    (input) =>
      respond("generate_video_from_references", () =>
        submitJob("generate_video_from_references", input, async (model) => {
          const references = await Promise.all((input.reference_image_paths ?? []).map(readInlineMedia));
          const frames = await Promise.all([input.first_frame_path, input.last_frame_path].filter((path) => path !== undefined).map(readInlineMedia));
          return submitVideo(client, model, {
            ...input,
            task: references.length ? "reference_to_video" : "image_to_video",
            images: [...frames, ...references],
          });
        }),
      ),
  );

  server.registerTool(
    "extend_video",
    { description: descriptions.extendVideo, inputSchema: schemas.extendVideoInput, annotations: generating },
    (input) => respond("extend_video", () => submitJob("extend_video", input, (model) => submitVideo(client, model, { ...input, task: "extend" }))),
  );

  server.registerTool(
    "edit_video",
    { description: descriptions.editVideo, inputSchema: schemas.editVideoInput, annotations: generating },
    (input) => respond("edit_video", () => submitJob("edit_video", input, (model) => submitVideo(client, model, { ...input, task: "edit" }))),
  );

  server.registerTool(
    "generate_speech",
    { description: descriptions.generateSpeech, inputSchema: schemas.generateSpeechInput, annotations: generating },
    (input) => respond("generate_speech", () => generateSpeech(client, resolveModel("generate_speech", input.model), input)),
  );

  server.registerTool(
    "generate_music",
    { description: descriptions.generateMusic, inputSchema: schemas.generateMusicInput, annotations: generating },
    (input) => respond("generate_music", () => submitJob("generate_music", input, (model) => submitMusic(client, model, input))),
  );

  server.registerTool(
    "create_voice",
    { description: descriptions.createVoice, inputSchema: schemas.createVoiceInput, annotations: generating },
    (input) => respond("create_voice", () => createVoice(client, input)),
  );

  server.registerTool(
    "list_voices",
    { description: descriptions.listVoices, inputSchema: schemas.listVoicesInput, annotations: readOnly },
    () => respond("list_voices", () => listVoices(client)),
  );

  server.registerTool(
    "get_job",
    { description: descriptions.getJob, inputSchema: schemas.getJobInput, annotations: readOnly },
    ({ job_id }) => respond("get_job", () => jobs.check(job_id)),
  );
}
