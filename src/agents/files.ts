import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isPlainObject } from "../case";
import { SKILL_NAME, skillSourceDir } from "../paths";

export async function readText(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

export async function writeText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

export async function readJsonObject(path: string): Promise<Record<string, unknown>> {
  const raw = await readText(path);
  if (raw === null || raw.trim() === "") return {};
  const parsed: unknown = JSON.parse(raw);
  if (!isPlainObject(parsed)) throw new Error(`${path} does not contain a JSON object.`);
  return parsed;
}

export async function updateJsonServers(
  path: string,
  key: string,
  update: (servers: Record<string, unknown>) => void,
): Promise<void> {
  const config = await readJsonObject(path);
  const servers = isPlainObject(config[key]) ? config[key] : {};
  update(servers);
  config[key] = servers;
  await writeText(path, `${JSON.stringify(config, null, 2)}\n`);
}

export async function installSkill(skillsDir: string): Promise<void> {
  const target = join(skillsDir, SKILL_NAME);
  await rm(target, { recursive: true, force: true });
  await mkdir(skillsDir, { recursive: true });
  await cp(skillSourceDir(), target, { recursive: true });
}

export async function uninstallSkill(skillsDir: string): Promise<void> {
  await rm(join(skillsDir, SKILL_NAME), { recursive: true, force: true });
}
