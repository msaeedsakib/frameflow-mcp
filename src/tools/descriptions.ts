export const instructions = `FrameFlow generates images, video, speech and music with Google's Nano Banana, Gemini Omni, Gemini TTS and Lyria models.

- Every generating tool writes its result to output_path and returns the final path. Tell the user that path and one line about what was produced.
- generate_image and generate_speech are synchronous (5-30 s). Video tools and generate_music return a job_id: poll get_job every 10-20 s until done or failed, usually 1-5 minutes. Don't start many jobs at once unless asked.
- Whenever the user refers to an existing image (logo, brand mark, product, character, style sample, or an image to change), pass its file path so the model sees it; describing it in words does not reproduce it. Ask for the path if you don't know it.
- Chain by path: generate_image, then animate_image, then extend_video in 10-second steps; pair a generate_speech voiceover with a generate_music bed.
- Every tool has a sensible default model. Pass model only to override it, as each tool's model parameter describes.
- Prompts: subject, setting, style, lighting and camera in one or two sentences; add motion and camera movement for video. Quote any text that must appear in an image.
- Jobs live in server memory. If get_job says the job is unknown, the server restarted: submit it again.`;

export const listModels =
  "List the model ids each tool accepts, what each is good for, and the default used when model is omitted. Only needed to compare or override models; every tool already works without choosing one.";

export const generateImage =
  "Create or edit an image from a prompt, optionally guided by existing images. If the user refers to ANY existing image (logo, brand mark, product photo, character, style sample, or an image to change) pass its file path in reference_image_paths; describing a logo in words is not enough. To change an image, pass it as the only reference and describe just the change. With several references, say in the prompt what each one is in order, e.g. 'Image 1 is the logo, reproduce it exactly. Image 2 is the product.' Writes a JPEG to output_path and returns the path.";

export const generateVideo =
  "Start a text-to-video job with native audio, from a prompt alone. If existing images or logos must appear use generate_video_from_references; to animate a specific still use animate_image. Mention sounds or dialogue in the prompt if wanted. Returns a job_id immediately; poll with get_job.";

export const animateImage =
  "Start an image-to-video job: the given local image becomes the first frame and the prompt describes the motion. For images that should merely appear in or guide the video (logos, products, style) use generate_video_from_references. Returns a job_id; poll with get_job.";

export const generateVideoFromReferences =
  "Start a video job when existing images must appear in the video: logos, products, characters or style samples via reference_image_paths (up to 3), and/or an exact first_frame_path and last_frame_path. Say in the prompt what each reference is. Returns a job_id; poll with get_job.";

export const extendVideo =
  "Start a job that makes an existing local video (10 s or shorter) longer by up to 10 seconds, guided by the prompt. For longer results, extend the output again in 10-second steps up to about 40 seconds. Returns a job_id; poll with get_job.";

export const editVideo =
  "Start a job that changes an existing local video (10 s or shorter) according to the prompt, e.g. style, weather or objects. Describe only the change. Returns a job_id; poll with get_job.";

export const generateSpeech =
  "Turn text into spoken audio (WAV): voiceovers, narration, dialogue, podcast lines, any 'read this aloud'. Single speaker: text + voice (+ style). Dialogue: turns + voices with at most 2 prebuilt voices. Custom voices from create_voice work for a single speaker only; for a dialogue with a custom voice, generate each turn separately and tell the user the files need joining. Synchronous; returns the written path.";

export const generateMusic =
  "Start a music job: songs with vocals, instrumentals, jingles, loops, background tracks. The prompt drives everything: genre, mood, tempo, instruments, structure, length, and lyrics inline with [Verse]/[Chorus]/[Bridge] tags or 'instrumental only'. Lyria 3.5 (default) makes full songs; lyria-3-clip-preview always makes a 30 s clip. Returns a job_id; poll with get_job. Lyrics used come back in the job's text.";

export const createVoice =
  "Create a reusable custom voice for generate_speech ('design a voice', 'a voice like…', 'clone my voice'). Design: name + a description of the voice in words. Replication: name + sample_path (the owner speaking) + consent_path (the same person reading Google's consent statement), both WAV. Never replicate a voice without the owner's consent recording; Google refuses it. Returns a voice_... id to pass as voice.";

export const listVoices =
  "List voices for generate_speech: the user's custom voices (voice_... ids and expiry) followed by the prebuilt catalog. Call when the user wants a specific kind of voice or one they created earlier.";

export const getJob =
  "Check a video or music job. Returns status running, done (with the written path, and lyrics text for music) or failed. Poll every 10-20 seconds; jobs take 1-5 minutes.";
