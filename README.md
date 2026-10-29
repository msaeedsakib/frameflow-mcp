# frameflow-mcp

MCP server for Google's generative media models with a plain Gemini API key: **Nano Banana** images, **Gemini Omni** video, **Gemini TTS** speech and custom voices, and **Lyria** music. One command stores the key and wires the server into Claude Code, Cursor and Codex.

## Install

1. Get an API key at https://aistudio.google.com/apikey.
2. Run the wizard:

```sh
npx @saeedsakib/frameflow-mcp setup
```

It stores the key, verifies it, and installs the server plus a skill into the agents you pick. Restart your agent afterwards.

Other commands:

| Command | What it does |
|---|---|
| `npx @saeedsakib/frameflow-mcp status` | Show where the key comes from, configured agents, and verify access |
| `npx @saeedsakib/frameflow-mcp remove` | Remove the server and skill from agents, optionally delete the key |
| `npx @saeedsakib/frameflow-mcp` | Run the stdio MCP server (what your agent runs) |

Any other MCP client, with the key passed in the environment instead of stored:

```json
{ "mcpServers": { "frameflow": { "command": "npx", "args": ["-y", "@saeedsakib/frameflow-mcp"], "env": { "GEMINI_API_KEY": "..." } } } }
```

`GEMINI_API_KEY` in the environment always wins over the stored key.

## Tools

Every generating tool writes to a local `output_path` and returns it. Video and music tools return a `job_id` immediately; poll `get_job` until it is `done`.

| Tool | Models | Purpose |
|---|---|---|
| `list_models` | | Allowed model ids per tool and the current defaults |
| `set_default_model` | | Persist a default model for a tool |
| `generate_image` | Nano Banana | Text to image, optionally guided by up to 14 reference images (logos, products, characters, style) |
| `generate_video` | Omni | Text to video with audio |
| `animate_image` | Omni | Image to video |
| `generate_video_from_references` | Omni | Reference images and/or first and last frames |
| `extend_video` | Omni | Continue a clip by up to 10 seconds |
| `edit_video` | Omni | Edit a clip by prompt |
| `generate_speech` | Gemini TTS | Text to WAV, one or two speakers, prebuilt or custom voice |
| `generate_music` | Lyria | Prompt to song or 30-second clip, lyrics inline |
| `create_voice` | | Design a voice from a description, or replicate one from a sample plus the owner's consent recording |
| `list_voices` | | Custom voices with ids, then the prebuilt catalog |
| `get_job` | | Poll a video or music job; writes the file when finished |

No default model is built in. Ask your agent to pick defaults once (`list_models` then `set_default_model`); they are stored in `~/.config/frameflow-mcp/config.json`.

Model ids: `gemini-nano-banana-2.1`, `gemini-3.1-flash-image`, `gemini-3-pro-image`, `gemini-3.1-flash-lite-image`, `gemini-omni-1.1-flash`, `gemini-3.8-flash-tts`, `gemini-3.8-flash-lite-tts`, `lyria-3.5`, `lyria-3-clip-preview`.

## Where things are written

| Path | Contents |
|---|---|
| `~/.config/frameflow-mcp/config.json` (or `$XDG_CONFIG_HOME`, `%APPDATA%` on Windows) | API key (owner-only file) and model defaults |
| `~/.claude.json` (or `$CLAUDE_CONFIG_DIR/.claude.json`) | Claude Code MCP entry |
| `~/.claude/skills/frameflow-mcp/` | Claude Code skill |
| `~/.cursor/mcp.json`, `~/.cursor/skills/frameflow-mcp/` | Cursor |
| `~/.codex/config.toml` (or `$CODEX_HOME`), `~/.agents/skills/frameflow-mcp/` | Codex |

## License

MIT
