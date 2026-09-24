export const listModels =
  "List the model ids each tool accepts and the current default for each. Call this first, then set_default_model for any tool whose default is null.";

export const setDefaultModel =
  "Persist the default model for a tool so later calls can omit `model`. Validated against the ids from list_models.";

export const generateImage =
  "Generate an image from a text prompt with a Nano Banana model and write it to output_path. Returns the written path.";

export const editImage =
  "Edit or compose images: pass one or more local reference images plus a prompt describing the change. Writes the result to output_path.";

export const generateVideo =
  "Start a text-to-video job. Returns a job_id immediately; poll with get_video_job. The file is written to output_path when done.";

export const animateImage =
  "Start an image-to-video job using a local image as the first frame. Returns a job_id; poll with get_video_job.";

export const generateVideoFromReferences =
  "Start a video job guided by reference images (subject/style) and/or explicit first and last frames. Returns a job_id; poll with get_video_job.";

export const extendVideo =
  "Start a job that continues an existing local video (max 10s) by up to 10 more seconds, guided by the prompt. Omni only. Returns a job_id.";

export const editVideo =
  "Start a job that edits an existing local video (max 10s) according to the prompt, e.g. change style, weather, or objects. Omni only. Returns a job_id.";

export const getVideoJob =
  "Check a video job. Returns status running, done (with the written path) or failed. Poll every 10-20 seconds; jobs take 1-5 minutes.";
