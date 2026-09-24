import pc from "picocolors";
import type { ServiceAccount } from "../credentials";
import type { AccessResult } from "./access-check";

export const log = {
  info: (message: string) => console.log(message),
  success: (message: string) => console.log(`${pc.green("✔")} ${message}`),
  warn: (message: string) => console.log(`${pc.yellow("!")} ${message}`),
  error: (message: string) => console.log(`${pc.red("✖")} ${message}`),
  step: (message: string) => console.log(`\n${pc.bold(message)}`),
};

export function reportAccess(result: AccessResult, account: ServiceAccount): void {
  switch (result.status) {
    case "ok":
      log.success(`Access verified for project ${pc.bold(account.project_id)}.`);
      return;
    case "api-disabled":
      log.error(`The ${result.api} is not enabled in project ${pc.bold(account.project_id)}.`);
      log.info(`  Enable it here: ${pc.cyan(result.url)}`);
      log.info(pc.dim("  It can take a minute or two to take effect after enabling."));
      return;
    case "error":
      log.error(result.message);
      return;
  }
}
