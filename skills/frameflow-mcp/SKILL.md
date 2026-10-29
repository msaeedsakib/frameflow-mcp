---
name: frameflow-mcp
description: Generate images, videos, speech and music with Google's Nano Banana, Gemini Omni, Gemini TTS and Lyria models through the frameflow MCP server, including compositions that use existing logos, products, characters or reference images, voiceovers and dialogue in prebuilt or custom voices, and songs or background tracks. Use when the user asks to create, edit, animate or extend an image or video, narrate or voice something, clone or design a voice, make a jingle, song or soundtrack, or produce any visual or audio asset.
---

# FrameFlow playbook

The `frameflow` MCP server runs Google's generative media models with the user's Gemini API key. Every tool writes its result to a local `output_path` and returns that path; nothing is returned inline.

## Workflow

1. **Check models once per session.** Call `list_models`. For any tool whose `default` is `null`, call `set_default_model` with a sensible pick and tell the user which you chose. Defaults persist across sessions. The user can ask you to change a default at any time.
2. **Images and speech are synchronous.** `generate_image` and `generate_speech` return when the file is written (5 to 30 seconds).
3. **Video and music are jobs.** `generate_video`, `animate_image`, `generate_video_from_references`, `extend_video`, `edit_video` and `generate_music` return a `job_id` immediately. Poll `get_job` every 10 to 20 seconds until `state.status` is `done` or `failed`. Expect 1 to 5 minutes. Do not start many jobs at once unless asked.
4. **Chain by path.** Generate a still with `generate_image`, feed its path to `animate_image`, feed the clip to `extend_video` in 10-second steps up to 40 seconds. Pair a `generate_speech` voiceover with a `generate_music` bed and hand both paths to the user.
5. **Report the path** and one line about what was produced.

## Using existing images (logos, products, characters)

Whenever the user mentions an image that already exists, the model has to see the file. Describing a logo or product in words does not reproduce it. Find the path (ask if unknown; files in the project folder or paths the user gave earlier are fair game) and pass it:

| User says | Tool | Parameter |
|---|---|---|
| "use our logo", "include this product", "same character as X.png", "in the style of Y" | `generate_image` | `reference_image_paths` |
| "change / fix / retouch this image" | `generate_image` | `reference_image_paths: [that image]`, prompt describes only the change |
| "put our logo in the video", "same character across clips" | `generate_video_from_references` | `reference_image_paths` |
| "animate this picture" | `animate_image` | `image_path` |
| "make this clip longer" / "change this clip" | `extend_video` / `edit_video` | `video_path` |
| "music that fits this artwork" | `generate_music` | `reference_image_paths` |

In the prompt, say what each reference is and how to treat it, in order: "Image 1 is the IRIXSOFT logo, reproduce it exactly. Image 2 is the product; keep its shape and colours." Pick `gemini-3-pro-image` when a logo or text must be exact.

## Speech and voices

| User says | Tool | How |
|---|---|---|
| "read this", "voiceover", "narrate" | `generate_speech` | `text` + `voice` (+ `style`) |
| "two people talking", "podcast intro", "dialogue" | `generate_speech` | `turns` + `voices`, at most 2 speakers, prebuilt voices only |
| "a voice like a gruff old sailor", "design a voice" | `create_voice` | `name` + `description`, then use the returned `voice_...` id as `voice` |
| "use my voice", "clone this voice" | `create_voice` | `name` + `sample_path` + `consent_path`; both WAV, the consent clip is the owner reading Google's consent statement |
| "which voices are there", "use the voice I made" | `list_voices` | pick by name or `voice_...` id |

Prebuilt voices: Zephyr, Puck, Charon, Kore, Fenrir, Leda, Orus, Aoede, Callirrhoe, Autonoe, Enceladus, Iapetus, Umbriel, Algieba, Despina, Erinome, Algenib, Rasalgethi, Laomedeia, Achernar, Alnilam, Schedar, Gacrux, Pulcherrima, Achird, Zubenelgenubi, Vindemiatrix, Sadachbia, Sadaltager, Sulafat. Kore and Puck are safe defaults.

`style` directs delivery: "cheerful and quick", "whispering", "calm newsreader". Custom voices work for single-speaker only; for a dialogue with a custom voice, generate each turn separately and tell the user the files need joining. Never create a replicated voice without a consent recording from the person; Google refuses it and so should you.

## Music

`generate_music` is prompt-only. Say genre, mood, tempo, instruments, structure and length. For vocals, put lyrics inline with `[Verse]`, `[Chorus]`, `[Bridge]` tags; for no vocals say "instrumental only". `lyria-3.5` writes full songs of a couple of minutes; `lyria-3-clip-preview` always returns a 30-second clip, good for jingles, loops and stings. Lyrics the model used come back in the job's `text`.

## Choosing models

| Tool | Good default | When to pick another |
|---|---|---|
| `generate_image` | `gemini-nano-banana-2.1` | `gemini-3-pro-image` for exact logos, text-heavy or complex compositions; `gemini-3.1-flash-lite-image` for cheap drafts (1K only) |
| video tools | `gemini-omni-1.1-flash` | only choice |
| `generate_speech` | `gemini-3.8-flash-tts` | `gemini-3.8-flash-lite-tts` for bulk or cheap narration |
| `generate_music` | `lyria-3.5` | `lyria-3-clip-preview` for 30-second clips |

## Argument rules

- Paths: absolute or `~/...`. Parent directories of `output_path` are created. Use `.jpg` for images (the API returns JPEG), `.mp4` for videos, `.wav` for speech and music (`.mp3` when `format: "mp3"`). The extension is corrected to match the format the API returns, so use the `path` from the response.
- `aspect_ratio` for images: `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `4:5`, `5:4`, `16:9`, `9:16`, `21:9`. For video: `16:9` or `9:16`.
- `image_size`: `1K` (default), `2K`, `4K`; Lite is `1K` only.
- `resolution`: `360p`, `720p` (default), `1080p`, `4k`. `duration_seconds`: 3 to 10.
- Input videos for `extend_video` and `edit_video` must be 10 seconds or shorter.
- `generate_image` takes up to 14 reference images; `generate_video_from_references` up to 3 plus optional first and last frames; `generate_music` up to 10.

## Prompting

- Images and video: subject, setting, style, lighting, camera in one or two sentences; for video add motion and camera movement. Omni generates audio with the video, so mention sounds or dialogue if wanted.
- Edits of a referenced image or clip: describe the change, not the whole scene.
- Text in images: ask for it explicitly and in quotes; Pro renders text best.

## Errors

- **No default set:** call `set_default_model` for that tool.
- **No Gemini API key:** the user runs `npx @saeedsakib/frameflow-mcp setup` or sets `GEMINI_API_KEY` for the server.
- **Key rejected:** `npx @saeedsakib/frameflow-mcp status` verifies the stored key; a new one comes from https://aistudio.google.com/apikey.
- **Filtered / no output returned:** the safety filter blocked the prompt or input. Rephrase or change the input media.
- **Unknown job:** jobs live in server memory; if the harness restarted the server, resubmit.
