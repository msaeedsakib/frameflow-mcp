import pc from "picocolors";
import { agents } from "../agents";
import { findApiKey } from "../config";
import { API_KEY_ENV, configPath, PACKAGE_NAME } from "../paths";
import { checkAccess } from "./access-check";
import { log, maskKey, reportAccess } from "./ui";

export async function status(): Promise<void> {
  const found = await findApiKey();
  log.step("API key");
  if (!found) {
    log.error(`No key found. Run ${pc.cyan(`npx ${PACKAGE_NAME} setup`)} or set ${API_KEY_ENV}.`);
  } else if (found.source === "env") {
    log.success(`${maskKey(found.apiKey)} ${pc.dim(`from ${API_KEY_ENV}`)}`);
  } else {
    log.success(`${maskKey(found.apiKey)} ${pc.dim(`from ${configPath()}`)}`);
  }

  log.step("Agents");
  for (const agent of agents) {
    const installed = await agent.isInstalled().catch(() => false);
    if (installed) log.success(`${agent.label} ${pc.dim(agent.configPath())}`);
    else log.info(`${pc.dim("-")} ${agent.label} ${pc.dim("not configured")}`);
  }

  if (found) {
    log.step("Access");
    reportAccess(await checkAccess(found.apiKey));
  }
}
