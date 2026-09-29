import { expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { defaultModelFor, loadConfig, setDefaultModel } from "../src/config";
import { configPath } from "../src/paths";
import { useTempHome } from "./helpers";

const home = useTempHome();

test("missing config yields no defaults", async () => {
  expect(await loadConfig()).toEqual({ defaults: {} });
  expect(await defaultModelFor("generate_image")).toBeUndefined();
});

test("set_default_model persists under the config dir and survives reload", async () => {
  await setDefaultModel("generate_image", "gemini-3-pro-image");
  await setDefaultModel("generate_video", "gemini-omni-1.1-flash-preview");
  expect(configPath()).toBe(join(home.path, ".config", "frameflow-mcp", "config.json"));
  expect(await defaultModelFor("generate_image")).toBe("gemini-3-pro-image");
  expect((await loadConfig()).defaults).toEqual({ generate_image: "gemini-3-pro-image", generate_video: "gemini-omni-1.1-flash-preview" });
});

test("a config with a removed tool key still loads", async () => {
  await mkdir(dirname(configPath()), { recursive: true });
  await writeFile(configPath(), JSON.stringify({ defaults: { edit_image: "gemini-3-pro-image", generate_image: "gemini-3.1-flash-image" } }));
  expect((await loadConfig()).defaults).toEqual({ generate_image: "gemini-3.1-flash-image" });
});
