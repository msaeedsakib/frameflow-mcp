import { homedir } from "node:os";
import { join } from "node:path";

export const PACKAGE_NAME = "@saeedsakib/frameflow-mcp";
export const SERVER_NAME = "frameflow";
export const SKILL_NAME = "frameflow-mcp";

export const home = () => process.env.HOME || homedir();

export function configDir(): string {
  if (process.platform === "win32" && process.env.APPDATA) return join(process.env.APPDATA, SKILL_NAME);
  return join(process.env.XDG_CONFIG_HOME || join(home(), ".config"), SKILL_NAME);
}

export function keyPath(): string {
  return join(configDir(), "service-account.json");
}

export function configPath(): string {
  return join(configDir(), "config.json");
}

export function skillSourceDir(): string {
  return join(import.meta.dirname, "..", "skills", SKILL_NAME);
}

export function normalizePath(input: string): string {
  const trimmed = input.trim().replace(/^['"]|['"]$/g, "").replace(/\\ /g, " ");
  const expanded = trimmed === "~" || trimmed.startsWith("~/") ? home() + trimmed.slice(1) : trimmed;
  return join(expanded.startsWith("/") || /^[A-Za-z]:/.test(expanded) ? "" : process.cwd(), expanded);
}
