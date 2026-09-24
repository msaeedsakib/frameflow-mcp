# frameflow-mcp

MCP server for Google's image and video models on your own Google Cloud project: **Nano Banana** (Gemini image models), **Gemini Omni** and **Veo 3.1**. One command stores a service account key and wires the server into Claude Code, Cursor and Codex.

## Install

```sh
npx @saeedsakib/frameflow-mcp setup
```

The wizard asks for your service account JSON key, verifies access, and installs the server plus a skill into the agents you pick. Restart your agent afterwards.

Other commands:

| Command | What it does |
|---|---|
| `npx @saeedsakib/frameflow-mcp status` | Show the stored key, configured agents and verify access |
| `npx @saeedsakib/frameflow-mcp remove` | Remove the server and skill from agents, optionally delete the key |
| `npx @saeedsakib/frameflow-mcp` | Run the stdio MCP server (what your agent runs) |

Any other MCP client:

```json
{ "mcpServers": { "frameflow": { "command": "npx", "args": ["-y", "@saeedsakib/frameflow-mcp"] } } }
```

## Google Cloud setup

1. Create or pick a project with billing enabled.
2. Enable the Vertex AI API (`aiplatform.googleapis.com`).
3. Create a service account, grant it **Vertex AI User** (`roles/aiplatform.user`), and download a JSON key.
4. Run `setup` and point it at the key. The file is copied to `~/.config/frameflow-mcp/service-account.json` with owner-only permissions; you can delete the download.

## Tools

Every generating tool writes to a local `output_path` and returns it. Video tools return a `job_id` immediately; poll `get_video_job` until it is `done`.

| Tool | Models | Purpose |
|---|---|---|
| `list_models` | | Allowed model ids per tool and the current defaults |
| `set_default_model` | | Persist a default model for a tool |
| `generate_image` | Nano Banana | Text to image |
| `edit_image` | Nano Banana | Edit or compose with up to 14 reference images |
| `generate_video` | Omni, Veo | Text to video |
| `animate_image` | Omni, Veo | Image to video |
| `generate_video_from_references` | Omni, Veo | Reference images and/or first and last frames |
| `extend_video` | Omni | Continue a clip by up to 10 seconds |
| `edit_video` | Omni | Edit a clip by prompt |
| `get_video_job` | | Poll a job; downloads the file when finished |

No default model is built in. Ask your agent to pick defaults once (`list_models` then `set_default_model`); they are stored in `~/.config/frameflow-mcp/config.json`.

Model ids: `gemini-3.1-flash-image`, `gemini-3-pro-image`, `gemini-3.1-flash-lite-image`, `gemini-omni-1.1-flash`, `veo-3.1-generate-001`, `veo-3.1-fast-generate-001`, `veo-3.1-lite-generate-preview`.

## Where things are written

| Path | Contents |
|---|---|
| `~/.config/frameflow-mcp/` (or `$XDG_CONFIG_HOME`, `%APPDATA%` on Windows) | `service-account.json`, `config.json` |
| `~/.claude.json` (or `$CLAUDE_CONFIG_DIR/.claude.json`) | Claude Code MCP entry |
| `~/.claude/skills/frameflow-mcp/` | Claude Code skill |
| `~/.cursor/mcp.json`, `~/.cursor/skills/frameflow-mcp/` | Cursor |
| `~/.codex/config.toml` (or `$CODEX_HOME`), `~/.agents/skills/frameflow-mcp/` | Codex |

## License

MIT
