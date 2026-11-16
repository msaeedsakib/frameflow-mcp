import { z } from "zod";
import { allowedModelsFor, defaultModels, modelById, type ToolName } from "../models";

function modelFor(tool: ToolName) {
  const allowed = allowedModelsFor(tool);
  const others = allowed.filter((id) => id !== defaultModels[tool]).map((id) => `${id} (${modelById(id).use})`);
  const hint = others.length ? ` Override only for a reason: ${others.join("; ")}.` : "";
  return z.enum(allowed).optional().describe(`Omit to use ${defaultModels[tool]}.${hint}`);
}

const outputPath = z
  .string()
  .min(1)
  .describe(
    "Absolute or ~ path to write the result to: .jpg for images, .mp4 for video, .wav for speech and music (.mp3 with format mp3). Parent directories are created. The extension is corrected to the returned format, so use the path in the response.",
  );
const prompt = z.string().min(1);
const localPath = z.string().min(1);

const imageOptions = {
  aspect_ratio: z.enum(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]).optional(),
  image_size: z.enum(["1K", "2K", "4K"]).optional().describe("Lite supports only 1K. Default 1K."),
};

const videoOptions = {
  aspect_ratio: z.enum(["16:9", "9:16"]).optional(),
  resolution: z.enum(["360p", "720p", "1080p", "4k"]).optional().describe("Default 720p; 1080p and 4k are upscaled."),
  duration_seconds: z.number().int().min(3).max(10).optional().describe("3 to 10 seconds."),
};

export const listModelsInput = z.object({});

export const generateImageInput = z.object({
  prompt,
  reference_image_paths: z
    .array(localPath)
    .max(14)
    .optional()
    .describe(
      "Local image files the model must see: logos, brand marks, product photos, characters, style samples, or an existing image to modify. Pass these whenever the user refers to an existing image; describing a logo in words is not enough.",
    ),
  output_path: outputPath,
  model: modelFor("generate_image"),
  ...imageOptions,
});

export const generateVideoInput = z.object({ prompt, output_path: outputPath, model: modelFor("generate_video"), ...videoOptions });

export const animateImageInput = z.object({
  prompt,
  image_path: localPath.describe("Local image used as the first frame."),
  output_path: outputPath,
  model: modelFor("animate_image"),
  ...videoOptions,
});

export const generateVideoFromReferencesInput = z
  .object({
    prompt,
    reference_image_paths: z
      .array(localPath)
      .max(3)
      .optional()
      .describe("Local images that must appear in or guide the video: logos, products, characters, style samples."),
    first_frame_path: localPath.optional().describe("Local image the video must start on."),
    last_frame_path: localPath.optional().describe("Local image the video must end on."),
    output_path: outputPath,
    model: modelFor("generate_video_from_references"),
    ...videoOptions,
  })
  .refine((input) => input.reference_image_paths?.length || input.first_frame_path || input.last_frame_path, {
    message: "Provide reference_image_paths, first_frame_path or last_frame_path.",
  });

const videoEdit = {
  prompt,
  video_path: localPath.describe("Local video, at most 10 seconds."),
  output_path: outputPath,
  ...videoOptions,
};

export const extendVideoInput = z.object({ ...videoEdit, model: modelFor("extend_video") });
export const editVideoInput = z.object({ ...videoEdit, model: modelFor("edit_video") });

const voiceName = z
  .string()
  .min(1)
  .describe("A prebuilt voice name or a custom voice_... id. Kore and Puck are safe defaults; call list_voices for the full catalog or the user's own voices.");

export const generateSpeechInput = z
  .object({
    text: z.string().min(1).optional().describe("What to say, for a single speaker. Use turns instead for a dialogue."),
    voice: voiceName.optional(),
    style: z.string().optional().describe("Delivery direction, e.g. 'cheerful and fast', 'whispering', 'calm newsreader'."),
    turns: z
      .array(z.object({ speaker: z.string().min(1), text: z.string().min(1), style: z.string().optional() }))
      .min(1)
      .optional()
      .describe("Dialogue between at most 2 speakers, in order. Needs voices."),
    voices: z.record(z.string(), z.string()).optional().describe("Speaker name to prebuilt voice name, e.g. { \"Joe\": \"Puck\", \"Jane\": \"Kore\" }. Custom voices are single-speaker only."),
    output_path: outputPath,
    model: modelFor("generate_speech"),
  })
  .refine((input) => Boolean(input.text) !== Boolean(input.turns?.length), { message: "Provide exactly one of text or turns." });

export const generateMusicInput = z.object({
  prompt: prompt.describe("Genre, mood, tempo, instruments, structure and length. Put lyrics inline with [Verse], [Chorus], [Bridge] tags, or say 'instrumental only'."),
  reference_image_paths: z.array(localPath).max(10).optional().describe("Optional images to set the mood, e.g. album art or a scene."),
  format: z.enum(["wav", "mp3"]).optional().describe("Default wav."),
  output_path: outputPath,
  model: modelFor("generate_music"),
});

export const createVoiceInput = z
  .object({
    name: z.string().min(1).describe("Display name for the new voice."),
    description: z.string().min(1).optional().describe("Voice design: describe age, gender, timbre, accent, pacing and personality in words."),
    sample_path: localPath.optional().describe("Voice replication: a clean 10-30 s WAV of the voice owner speaking."),
    consent_path: localPath.optional().describe("Voice replication: a WAV of the same person reading Google's consent statement."),
  })
  .refine((input) => Boolean(input.description) !== Boolean(input.sample_path || input.consent_path), {
    message: "Provide either description (design) or sample_path + consent_path (replication).",
  });

export const listVoicesInput = z.object({});

export const getJobInput = z.object({ job_id: z.string().min(1) });

export type VideoOptions = z.infer<z.ZodObject<typeof videoOptions>>;
export type ImageOptions = z.infer<z.ZodObject<typeof imageOptions>>;
