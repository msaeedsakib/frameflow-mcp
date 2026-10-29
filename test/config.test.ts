import { expect, test } from "bun:test";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { clearApiKey, defaultModelFor, findApiKey, loadConfig, resolveApiKey, setDefaultModel, storeApiKey } from "../src/config";
import { configPath } from "../src/paths";
import { useTempHome } from "./helpers";

const home = useTempHome();

test("missing config yields no defaults and no key", async () => {
  expect(await loadConfig()).toEqual({ defaults: {} });
  expect(await defaultModelFor("generate_image")).toBeUndefined();
  await expect(resolveApiKey()).rejects.toThrow("Run `npx @saeedsakib/frameflow-mcp setup` or set GEMINI_API_KEY");
});

test("set_default_model persists under the config dir and survives reload", async () => {
  await setDefaultModel("generate_image", "gemini-3-pro-image");
  await setDefaultModel("generate_speech", "gemini-3.8-flash-tts");
  expect(configPath()).toBe(join(home.path, ".config", "frameflow-mcp", "config.json"));
  expect(await defaultModelFor("generate_image")).toBe("gemini-3-pro-image");
  expect((await loadConfig()).defaults).toEqual({ generate_image: "gemini-3-pro-image", generate_speech: "gemini-3.8-flash-tts" });
});

test("a config with a removed tool key still loads", async () => {
  await mkdir(dirname(configPath()), { recursive: true });
  await writeFile(configPath(), JSON.stringify({ defaults: { edit_image: "gemini-3-pro-image", generate_image: "gemini-3.1-flash-image" } }));
  expect((await loadConfig()).defaults).toEqual({ generate_image: "gemini-3.1-flash-image" });
});

test("stored key is owner-only, kept across default changes, and cleared on request", async () => {
  await storeApiKey("AIza-stored");
  expect((await stat(configPath())).mode & 0o777).toBe(0o600);
  await setDefaultModel("generate_image", "gemini-nano-banana-2.1");
  expect(await findApiKey()).toEqual({ apiKey: "AIza-stored", source: "config" });
  await clearApiKey();
  expect(await findApiKey()).toBeNull();
  expect((await loadConfig()).defaults).toEqual({ generate_image: "gemini-nano-banana-2.1" });
});

test("GEMINI_API_KEY beats the stored key", async () => {
  await storeApiKey("AIza-stored");
  process.env.GEMINI_API_KEY = "AIza-env";
  expect(await findApiKey()).toEqual({ apiKey: "AIza-env", source: "env" });
  expect(await resolveApiKey()).toBe("AIza-env");
});
