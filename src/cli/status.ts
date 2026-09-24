import pc from "picocolors";
import { agents } from "../agents";
import { loadStoredServiceAccount } from "../credentials";
import { keyPath, PACKAGE_NAME } from "../paths";
import { checkAccess } from "./access-check";
import { log, reportAccess } from "./ui";

export async function status(): Promise<void> {
  const account = await loadStoredServiceAccount();
  log.step("Key");
  if (!account) {
    log.error(`No valid key at ${keyPath()}. Run ${pc.cyan(`npx ${PACKAGE_NAME} setup`)}.`);
  } else {
    log.success(`${pc.dim(keyPath())}`);
    log.info(`  Service account: ${pc.cyan(account.client_email)}`);
    log.info(`  Project: ${account.project_id}`);
  }

  log.step("Agents");
  for (const agent of agents) {
    const installed = await agent.isInstalled().catch(() => false);
    if (installed) log.success(`${agent.label} ${pc.dim(agent.configPath())}`);
    else log.info(`${pc.dim("-")} ${agent.label} ${pc.dim("not configured")}`);
  }

  if (account) {
    log.step("Access");
    reportAccess(await checkAccess(account), account);
  }
}
