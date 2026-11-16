import { afterEach, beforeEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function useTempHome(): { readonly path: string } {
  const state = { path: "" };
  const saved = { HOME: process.env.HOME, GEMINI_API_KEY: process.env.GEMINI_API_KEY };
  beforeEach(async () => {
    state.path = await mkdtemp(join(tmpdir(), "frameflow-mcp-"));
    process.env.HOME = state.path;
    delete process.env.GEMINI_API_KEY;
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
