import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { generatingTools, type ModelId, type ToolName } from "./models";
import { configPath } from "./paths";

const configSchema = z.object({
  defaults: z.partialRecord(z.enum(generatingTools), z.string()).default({}),
});

export type Config = z.infer<typeof configSchema>;

export async function loadConfig(path = configPath()): Promise<Config> {
  try {
    return configSchema.parse(JSON.parse(await readFile(path, "utf8")));
  } catch {
    return { defaults: {} };
  }
}

export async function saveConfig(config: Config, path = configPath()): Promise<void> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
}

export async function setDefaultModel(tool: ToolName, model: ModelId, path = configPath()): Promise<Config> {
  const config = await loadConfig(path);
  config.defaults[tool] = model;
  await saveConfig(config, path);
  return config;
}

export async function defaultModelFor(tool: ToolName, path = configPath()): Promise<string | undefined> {
  return (await loadConfig(path)).defaults[tool];
}
