import { afterEach, beforeEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const serviceAccount = {
  type: "service_account",
  project_id: "demo-project",
  private_key_id: "abc",
  private_key: "-----BEGIN PRIVATE KEY-----\nxyz\n-----END PRIVATE KEY-----\n",
  client_email: "frameflow@demo-project.iam.gserviceaccount.com",
  token_uri: "https://oauth2.googleapis.com/token",
} as const;

export function useTempHome(): { readonly path: string } {
  const state = { path: "" };
  const saved = { HOME: process.env.HOME, XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME, CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR, CODEX_HOME: process.env.CODEX_HOME };
  beforeEach(async () => {
    state.path = await mkdtemp(join(tmpdir(), "frameflow-mcp-"));
    process.env.HOME = state.path;
    delete process.env.XDG_CONFIG_HOME;
    delete process.env.CLAUDE_CONFIG_DIR;
    delete process.env.CODEX_HOME;
  });
  afterEach(async () => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(state.path, { recursive: true, force: true });
  });
  return state;
}
