---
name: frameflow-mcp
description: Generate and edit images and videos with Google's Nano Banana, Gemini Omni and Veo models through the frameflow MCP server. Use when the user asks to create, edit, animate or extend an image or video, make a thumbnail, poster, clip, ad, or any visual asset.
---

# FrameFlow playbook

The `frameflow` MCP server runs Google image and video models on the user's own Google Cloud project via a service account. Every tool writes its result to a local `output_path` and returns that path; nothing is returned inline.

## Workflow

1. **Check models once per session.** Call `list_models`. For any tool whose `default` is `null`, call `set_default_model` with a sensible pick and tell the user which you chose. Defaults persist across sessions, so this is usually a one-time step. The user can ask you to change a default at any time.
2. **Images are synchronous.** `generate_image` and `edit_image` return when the file is written (5 to 30 seconds).
3. **Videos are jobs.** `generate_video`, `animate_image`, `generate_video_from_references`, `extend_video` and `edit_video` return a `job_id` immediately. Poll `get_video_job` every 10 to 20 seconds until `state.status` is `done` or `failed`. Expect 1 to 5 minutes. Do not start many jobs at once unless asked.
4. **Chain by path.** Generate a still with `generate_image`, then feed its path to `animate_image`. Feed a finished clip's path to `extend_video` to grow it in 10-second steps, up to 40 seconds total.
5. **Report the path** and one line about what was produced.

## Choosing models

| Tool | Good default | When to pick another |
|---|---|---|
| `generate_image`, `edit_image` | `gemini-3.1-flash-image` (Nano Banana 2) | `gemini-3-pro-image` for text-heavy, brand-accurate or complex compositions; `gemini-3.1-flash-lite-image` for cheap drafts (1K max) |
| `generate_video`, `animate_image`, `generate_video_from_references` | `gemini-omni-1.1-flash` | `veo-3.1-generate-001` for native audio and 8s clips with `generate_audio`; `veo-3.1-lite-generate-preview` for cheap drafts |
| `extend_video`, `edit_video` | `gemini-omni-1.1-flash` | Omni only |

## Argument rules

- Paths: absolute or `~/...`. Parent directories of `output_path` are created. Use `.png` for images and `.mp4` for videos.
- `aspect_ratio` for images: `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `4:5`, `5:4`, `16:9`, `9:16`, `21:9`. For video: `16:9` or `9:16`.
- `image_size`: `1K`, `2K`, `4K` (Lite: `1K` max).
- `resolution`: Omni `360p` to `4k`; Veo `720p` or `1080p`.
- `duration_seconds`: Omni 3 to 10; Veo 4, 6 or 8.
- `generate_audio` and `negative_prompt` only affect Veo.
- Input videos for `extend_video` and `edit_video` must be 10 seconds or shorter.
- `edit_image` takes up to 14 reference images; `generate_video_from_references` takes up to 3 references plus optional first and last frames.

## Prompting

- Describe subject, setting, style, lighting and camera in one or two sentences. For video add motion and camera movement.
- For edits, describe the change, not the whole scene: "make the sky stormy, keep everything else".
- Ask for text in images explicitly and in quotes; Pro renders text best.

## Errors

- **No default set:** call `set_default_model` for that tool.
- **No service account key:** the user needs to run `npx @saeedsakib/frameflow-mcp setup`.
- **API not enabled / permission denied:** `npx @saeedsakib/frameflow-mcp status` prints the enable link and the role to grant (`roles/aiplatform.user`).
- **Filtered / no video returned:** the safety filter blocked the prompt or input. Rephrase or change the input media.
- **Unknown job:** jobs live in server memory; if the harness restarted the server, resubmit.
