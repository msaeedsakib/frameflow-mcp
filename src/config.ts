import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { generatingTools, type ModelId, type ToolName } from "./models";
import { API_KEY_ENV, configPath, PACKAGE_NAME } from "./paths";

const configSchema = z.object({
  api_key: z.string().min(1).optional(),
  defaults: z.record(z.string(), z.string()).default({}),
});

export type Config = { api_key?: string; defaults: Partial<Record<ToolName, string>> };

const isTool = (key: string): key is ToolName => (generatingTools as readonly string[]).includes(key);

export async function loadConfig(path = configPath()): Promise<Config> {
  try {
    const { api_key, defaults } = configSchema.parse(JSON.parse(await readFile(path, "utf8")));
    return { api_key, defaults: Object.fromEntries(Object.entries(defaults).filter(([key]) => isTool(key))) };
  } catch {
    return { defaults: {} };
  }
}

export async function saveConfig(config: Config, path = configPath()): Promise<void> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  await chmod(path, 0o600);
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

export async function storeApiKey(apiKey: string, path = configPath()): Promise<void> {
  const config = await loadConfig(path);
  await saveConfig({ ...config, api_key: apiKey }, path);
}

export async function clearApiKey(path = configPath()): Promise<void> {
  const { api_key: _dropped, ...rest } = await loadConfig(path);
  await saveConfig(rest, path);
}

export type ApiKeySource = { apiKey: string; source: "env" | "config" } | null;

export async function findApiKey(path = configPath()): Promise<ApiKeySource> {
  const fromEnv = process.env[API_KEY_ENV]?.trim();
  if (fromEnv) return { apiKey: fromEnv, source: "env" };
  const stored = (await loadConfig(path)).api_key;
  return stored ? { apiKey: stored, source: "config" } : null;
}

export async function resolveApiKey(path = configPath()): Promise<string> {
  const found = await findApiKey(path);
  if (!found) throw new Error(`No Gemini API key found. Run \`npx ${PACKAGE_NAME} setup\` or set ${API_KEY_ENV}.`);
  return found.apiKey;
}
