# frameflow-mcp

MCP server for Google's generative media models with a plain Gemini API key: **Nano Banana** images, **Gemini Omni** video, **Gemini TTS** speech and custom voices, and **Lyria** music. No setup step and no skill: add it to your agent with the key and it works.

## Install

Get an API key at https://aistudio.google.com/apikey, then add the server.

**Claude Code**

```sh
claude mcp add frameflow -s user -e GEMINI_API_KEY=your-key -- npx -y @saeedsakib/frameflow-mcp
```

**Codex**

```sh
codex mcp add frameflow --env GEMINI_API_KEY=your-key -- npx -y @saeedsakib/frameflow-mcp
```

The first `npx` run downloads the package and can take longer than Codex's default startup timeout. If the server fails to start, set `startup_timeout_sec = 60` under `[mcp_servers.frameflow]` in `~/.codex/config.toml`.

**Cursor and any other MCP client**

```json
{ "mcpServers": { "frameflow": { "command": "npx", "args": ["-y", "@saeedsakib/frameflow-mcp"], "env": { "GEMINI_API_KEY": "your-key" } } } }
```

Cursor reads this from `~/.cursor/mcp.json`.

Restart or reload your agent afterwards. The server tells the agent how to use its tools when it connects, so no skill or prompt file is needed.

## Tools

Every generating tool writes to a local `output_path` and returns it. Video and music tools return a `job_id` immediately; the agent polls `get_job` until it is `done`.

| Tool | Models | Purpose |
|---|---|---|
| `generate_image` | Nano Banana | Text to image, optionally guided by up to 14 reference images (logos, products, characters, style, an image to edit) |
| `generate_video` | Omni | Text to video with audio |
| `animate_image` | Omni | Image to video |
| `generate_video_from_references` | Omni | Reference images and/or first and last frames |
| `extend_video` | Omni | Continue a clip by up to 10 seconds |
| `edit_video` | Omni | Edit a clip by prompt |
| `generate_speech` | Gemini TTS | Text to WAV, one or two speakers, prebuilt or custom voice |
| `generate_music` | Lyria | Prompt to song or 30-second clip, lyrics inline |
| `create_voice` | | Design a voice from a description, or replicate one from a sample plus the owner's consent recording |
| `list_voices` | | Custom voices with ids, then the prebuilt catalog |
| `list_models` | | Allowed models per tool, what each is for, and the defaults |
| `get_job` | | Poll a video or music job; writes the file when finished |

## Models

Each tool has a built-in default. Ask for another model by name ("use Nano Banana Pro for this logo") and the agent passes it for that call.

| Tools | Default | Alternatives |
|---|---|---|
| `generate_image` | `gemini-nano-banana-2.1` | `gemini-3-pro-image` for exact logos and text, `gemini-3.1-flash-image`, `gemini-3.1-flash-lite-image` for cheap 1K drafts |
| video tools | `gemini-omni-1.1-flash` | |
| `generate_speech` | `gemini-3.8-flash-tts` | `gemini-3.8-flash-lite-tts` for bulk narration |
| `generate_music` | `lyria-3.5` | `lyria-3-clip-preview` for 30-second clips |

## Upgrading from 0.3.0

0.3.0 stored the key in a config file and installed a skill. Both are gone. Remove the old pieces, then add the server again with one of the commands above:

```sh
claude mcp remove frameflow
rm -rf ~/.claude/skills/frameflow-mcp ~/.cursor/skills/frameflow-mcp ~/.agents/skills/frameflow-mcp ~/.config/frameflow-mcp
```

For Codex, `codex mcp remove frameflow`; for Cursor, delete the `frameflow` entry from `~/.cursor/mcp.json`. If you set `CLAUDE_CONFIG_DIR`, `CODEX_HOME` or `XDG_CONFIG_HOME` (`%APPDATA%` on Windows), remove `skills/frameflow-mcp` and `frameflow-mcp` under those directories instead.

## License

MIT
