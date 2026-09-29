---
name: frameflow-mcp
description: Generate and edit images and videos with Google's Nano Banana, Gemini Omni and Veo models through the frameflow MCP server, including compositions that use existing logos, products, characters or reference images. Use when the user asks to create, edit, animate or extend an image or video, make a thumbnail, poster, banner, clip, ad, or any visual asset.
---

# FrameFlow playbook

The `frameflow` MCP server runs Google image and video models on the user's own Google Cloud project via a service account. Every tool writes its result to a local `output_path` and returns that path; nothing is returned inline.

## Workflow

1. **Check models once per session.** Call `list_models`. For any tool whose `default` is `null`, call `set_default_model` with a sensible pick and tell the user which you chose. Defaults persist across sessions, so this is usually a one-time step. The user can ask you to change a default at any time.
2. **Images are synchronous.** `generate_image` returns when the file is written (5 to 30 seconds). It is the only image tool; edits and compositions with existing images go through its `reference_image_paths`.
3. **Videos are jobs.** `generate_video`, `animate_image`, `generate_video_from_references`, `extend_video` and `edit_video` return a `job_id` immediately. Poll `get_video_job` every 10 to 20 seconds until `state.status` is `done` or `failed`. Expect 1 to 5 minutes. Do not start many jobs at once unless asked.
4. **Chain by path.** Generate a still with `generate_image`, then feed its path to `animate_image`. Feed a finished clip's path to `extend_video` to grow it in 10-second steps, up to 40 seconds total.
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

In the prompt, say what each reference is and how to treat it, in order: "Image 1 is the IRIXSOFT logo, reproduce it exactly. Image 2 is the product; keep its shape and colours." Pick `gemini-3-pro-image` when a logo or text must be exact.

## Choosing models

| Tool | Good default | When to pick another |
|---|---|---|
| `generate_image` | `gemini-3.1-flash-image` (Nano Banana 2) | `gemini-3-pro-image` for exact logos, text-heavy or complex compositions; `gemini-3.1-flash-lite-image` for cheap drafts (1K max) |
| `generate_video`, `animate_image`, `generate_video_from_references` | `gemini-omni-1.1-flash-preview` | `veo-3.1-generate-001` for native audio and 8s clips with `generate_audio`; `veo-3.1-fast-generate-001` for cheaper, faster drafts |
| `extend_video`, `edit_video` | `gemini-omni-1.1-flash-preview` | Omni only |

## Argument rules

- Paths: absolute or `~/...`. Parent directories of `output_path` are created. Use `.png` for images and `.mp4` for videos. The extension is corrected to match the format the API returns, so use the `path` from the response.
- `aspect_ratio` for images: `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `4:5`, `5:4`, `16:9`, `9:16`, `21:9`. For video: `16:9` or `9:16`.
- `image_size`: `1K`, `2K`, `4K` (Lite: `1K` max).
- `resolution`: Omni `360p` to `4k`; Veo `720p` or `1080p`.
- `duration_seconds`: Omni 3 to 10; Veo 4, 6 or 8.
- `generate_audio` and `negative_prompt` only affect Veo.
- Input videos for `extend_video` and `edit_video` must be 10 seconds or shorter.
- `generate_image` takes up to 14 reference images; `generate_video_from_references` takes up to 3 references plus optional first and last frames.

## Prompting

- Describe subject, setting, style, lighting and camera in one or two sentences. For video add motion and camera movement.
- For edits of a referenced image, describe the change, not the whole scene: "make the sky stormy, keep everything else".
- Ask for text in images explicitly and in quotes; Pro renders text best.

## Errors

- **No default set:** call `set_default_model` for that tool.
- **No service account key:** the user needs to run `npx @saeedsakib/frameflow-mcp setup`.
- **API not enabled / permission denied:** `npx @saeedsakib/frameflow-mcp status` prints the enable link and the role to grant (`roles/aiplatform.user`).
- **Filtered / no video returned:** the safety filter blocked the prompt or input. Rephrase or change the input media.
- **Unknown job:** jobs live in server memory; if the harness restarted the server, resubmit.
