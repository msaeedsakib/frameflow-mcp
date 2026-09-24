import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { existsSync } from "node:fs";
import pc from "picocolors";
import { agents, genericSnippet } from "../agents";
import { readServiceAccount, storeServiceAccount, type ServiceAccount } from "../credentials";
import { keyPath, normalizePath } from "../paths";
import { checkAccess } from "./access-check";
import { log, reportAccess } from "./ui";

const SKILL_URL = "https://github.com/msaeedsakib/frameflow-mcp/blob/main/skills/frameflow-mcp/SKILL.md";

async function promptServiceAccount(): Promise<ServiceAccount> {
  let account: ServiceAccount | undefined;
  await input({
    message: "Path to your service account JSON key (drag the file here):",
    validate: async (value) => {
      if (!value.trim()) return "Enter a file path.";
      try {
        account = await readServiceAccount(normalizePath(value));
        return true;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
  });
  if (!account) throw new Error("No service account key provided.");
  return account;
}

async function verifyLoop(account: ServiceAccount): Promise<void> {
  for (;;) {
    log.step("Checking access to Gemini Enterprise Agent Platform…");
    const result = await checkAccess(account);
    reportAccess(result, account);
    if (result.status === "ok") return;
    const next = await select({
      message: "What next?",
      choices: [
        { name: "I fixed it, check again", value: "retry" },
        { name: "Continue anyway", value: "continue" },
        { name: "Quit", value: "quit" },
      ],
    });
    if (next === "continue") return;
    if (next === "quit") process.exit(1);
  }
}

async function chooseAgents(): Promise<void> {
  log.step("Choose where to install the MCP server and the frameflow-mcp skill");
  const selected = await checkbox({
    message: "Agents:",
    choices: [
      ...agents.map((agent) => ({
        name: agent.label,
        value: agent.id,
        checked: agent.detected(),
      })),
      { name: "Other / custom harness (print config)", value: "other" },
    ],
  });
  for (const agent of agents.filter((agent) => selected.includes(agent.id))) {
    try {
      await agent.install();
      log.success(`${agent.label}: ${pc.dim(agent.configPath())}, skill in ${pc.dim(agent.skillsDir())}`);
    } catch (error) {
      log.error(`${agent.label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (selected.includes("other")) {
    log.step("Add this to your MCP client's config:");
    log.info(genericSnippet);
    log.info(`\nSkill for your agent: ${pc.cyan(SKILL_URL)}`);
  }
  if (selected.length === 0) log.warn("No agents selected. Run setup again any time.");
}

export async function setup(): Promise<void> {
  log.info(pc.bold("FrameFlow MCP setup\n"));
  const existing = existsSync(keyPath());
  const replace =
    !existing || (await confirm({ message: `A key is already stored at ${keyPath()}. Replace it?`, default: false }));

  let account: ServiceAccount;
  if (replace) {
    account = await promptServiceAccount();
    await storeServiceAccount(account);
    log.success(`Key stored at ${pc.dim(keyPath())} ${pc.dim("(owner read/write only)")}`);
    log.info(pc.dim("  You can delete the downloaded file now."));
  } else {
    account = await readServiceAccount(keyPath());
  }
  log.info(`  Service account: ${pc.cyan(account.client_email)}`);

  await verifyLoop(account);
  await chooseAgents();
  log.info(`\n${pc.green("Done.")} Restart your agent so it picks up the new MCP server.`);
}
