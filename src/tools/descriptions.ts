export const listModels =
  "List the model ids each tool accepts and the current default for each. Call this first, then set_default_model for any tool whose default is null.";

export const setDefaultModel =
  "Persist the default model for a tool so later calls can omit `model`. Validated against the ids from list_models.";

export const generateImage =
  "Create an image from a prompt, optionally guided by existing images. If the user refers to ANY existing image (logo, brand mark, product photo, character, style sample, or an image to modify) pass its file path in reference_image_paths so the model can see it; describing a logo in words is not enough. Up to 14 references. Writes a JPEG to output_path and returns the path.";

export const generateVideo =
  "Start a text-only text-to-video job with native audio. If existing images or logos must appear in the video use generate_video_from_references; to animate a specific still use animate_image. Returns a job_id immediately; poll with get_job. The file is written to output_path when done.";

export const animateImage =
  "Start an image-to-video job where the given local image becomes the first frame and the prompt describes the motion. For images that should merely appear in or guide the video (logos, products, style) use generate_video_from_references instead. Returns a job_id; poll with get_job.";

export const generateVideoFromReferences =
  "Use when existing images must appear in the video: logos, products, characters or style samples via reference_image_paths (up to 3), and/or an exact first_frame_path and last_frame_path. Returns a job_id; poll with get_job.";

export const extendVideo =
  "Start a job that continues an existing local video (max 10s) by up to 10 more seconds, guided by the prompt. Returns a job_id; poll with get_job.";

export const editVideo =
  "Start a job that edits an existing local video (max 10s) according to the prompt, e.g. change style, weather, or objects. Returns a job_id; poll with get_job.";

export const generateSpeech =
  "Turn text into spoken audio (WAV). Use for voiceovers, narration, dialogue, podcast lines or any 'read this aloud'. Single speaker: text + voice (+ optional style). Dialogue: turns + voices with at most 2 prebuilt voices. Custom voices from create_voice or list_voices work for single speaker only. Synchronous; returns the written path.";

export const generateMusic =
  "Start a music generation job: songs with vocals, instrumentals, jingles, loops, background tracks. Everything is driven by the prompt: genre, mood, tempo, instruments, length, and lyrics inline with [Verse]/[Chorus] tags or 'instrumental only'. lyria-3.5 makes full songs; lyria-3-clip-preview makes 30 s clips. Returns a job_id; poll with get_job. Lyrics come back in the job's text.";

export const createVoice =
  "Create a reusable custom voice for generate_speech. Voice design: give a name and a description of the voice in words. Voice replication: give a name plus sample_path (the owner speaking) and consent_path (the same person reading Google's consent statement); replication without the owner's consent recording is refused by Google. Returns a voice_... id to pass as `voice`.";

export const listVoices =
  "List voices available to generate_speech: the user's custom voices (with voice_... ids and expiry) followed by the prebuilt catalog. Call before picking a voice when the user asks for a specific kind of voice or a voice they created earlier.";

export const getJob =
  "Check a video or music job. Returns status running, done (with the written path, and lyrics text for music) or failed. Poll every 10-20 seconds; jobs take 1-5 minutes.";
