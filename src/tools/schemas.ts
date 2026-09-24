import { z } from "zod";
import { allowedModelsFor, generatingTools, type ToolName } from "../models";

const modelFor = (tool: ToolName) =>
  z.enum(allowedModelsFor(tool)).optional().describe("Model id. Omit to use the default set with set_default_model.");

const outputPath = z
  .string()
  .min(1)
  .describe("Absolute or ~ path to write the result to. Parent directories are created. The extension is corrected to match the returned format.");
const prompt = z.string().min(1);

const imageOptions = {
  aspect_ratio: z.enum(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]).optional(),
  image_size: z.enum(["512", "1K", "2K", "4K"]).optional().describe("Lite supports up to 1K; Flash and Pro up to 4K."),
};

const videoOptions = {
  aspect_ratio: z.enum(["16:9", "9:16"]).optional(),
  resolution: z.enum(["360p", "720p", "1080p", "4k"]).optional().describe("Veo supports 720p and 1080p; Omni all four."),
  duration_seconds: z.number().int().min(3).max(10).optional().describe("Omni: 3-10. Veo: 4, 6 or 8."),
  generate_audio: z.boolean().optional().describe("Veo only."),
  negative_prompt: z.string().optional().describe("Veo only."),
};

export const listModelsInput = z.object({});

export const setDefaultModelInput = z.object({
  tool: z.enum(generatingTools),
  model: z.string().min(1).describe("One of the ids listed by list_models for this tool."),
});

export const generateImageInput = z.object({ prompt, output_path: outputPath, model: modelFor("generate_image"), ...imageOptions });

export const editImageInput = z.object({
  prompt,
  reference_image_paths: z.array(z.string().min(1)).min(1).max(14).describe("Local image files to edit or use as references."),
  output_path: outputPath,
  model: modelFor("edit_image"),
  ...imageOptions,
});

export const generateVideoInput = z.object({ prompt, output_path: outputPath, model: modelFor("generate_video"), ...videoOptions });

export const animateImageInput = z.object({
  prompt,
  image_path: z.string().min(1).describe("Local image used as the first frame."),
  output_path: outputPath,
  model: modelFor("animate_image"),
  ...videoOptions,
});

export const generateVideoFromReferencesInput = z
  .object({
    prompt,
    reference_image_paths: z.array(z.string().min(1)).max(3).optional().describe("Subject or style references."),
    first_frame_path: z.string().min(1).optional(),
    last_frame_path: z.string().min(1).optional(),
    output_path: outputPath,
    model: modelFor("generate_video_from_references"),
    ...videoOptions,
  })
  .refine((input) => input.reference_image_paths?.length || input.first_frame_path || input.last_frame_path, {
    message: "Provide reference_image_paths, first_frame_path or last_frame_path.",
  });

const videoEdit = {
  prompt,
  video_path: z.string().min(1).describe("Local video, at most 10 seconds."),
  output_path: outputPath,
  ...videoOptions,
};

export const extendVideoInput = z.object({ ...videoEdit, model: modelFor("extend_video") });
export const editVideoInput = z.object({ ...videoEdit, model: modelFor("edit_video") });

export const getVideoJobInput = z.object({ job_id: z.string().min(1) });

export type VideoOptions = z.infer<z.ZodObject<typeof videoOptions>>;
export type ImageOptions = z.infer<z.ZodObject<typeof imageOptions>>;
