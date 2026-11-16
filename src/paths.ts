import { homedir } from "node:os";
import { join } from "node:path";

export const API_KEY_ENV = "GEMINI_API_KEY";
export const API_KEY_URL = "https://aistudio.google.com/apikey";

const home = () => process.env.HOME || homedir();

export function normalizePath(input: string): string {
  const trimmed = input.trim().replace(/^['"]|['"]$/g, "").replace(/\\ /g, " ");
  const expanded = trimmed === "~" || trimmed.startsWith("~/") ? home() + trimmed.slice(1) : trimmed;
  return join(expanded.startsWith("/") || /^[A-Za-z]:/.test(expanded) ? "" : process.cwd(), expanded);
}
