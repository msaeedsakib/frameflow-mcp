import pc from "picocolors";
import type { AccessResult } from "./access-check";

export const log = {
  info: (message: string) => console.log(message),
  success: (message: string) => console.log(`${pc.green("✔")} ${message}`),
  warn: (message: string) => console.log(`${pc.yellow("!")} ${message}`),
  error: (message: string) => console.log(`${pc.red("✖")} ${message}`),
  step: (message: string) => console.log(`\n${pc.bold(message)}`),
};

export function reportAccess(result: AccessResult): void {
  if (result.status === "ok") log.success("API key verified.");
  else log.error(result.message);
}

export const maskKey = (key: string) => `${key.slice(0, 6)}…${key.slice(-4)}`;
