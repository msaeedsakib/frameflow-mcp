import { checkbox, confirm, password, select } from "@inquirer/prompts";
import pc from "picocolors";
import { agents, genericSnippet } from "../agents";
import { findApiKey, storeApiKey } from "../config";
import { API_KEY_ENV, API_KEY_URL, configPath } from "../paths";
import { checkAccess } from "./access-check";
import { log, maskKey, reportAccess } from "./ui";

const SKILL_URL = "https://github.com/msaeedsakib/frameflow-mcp/blob/main/skills/frameflow-mcp/SKILL.md";

async function promptApiKey(): Promise<string> {
  log.info(`  Get a key at ${pc.cyan(API_KEY_URL)}`);
  return password({
    message: "Gemini API key:",
    mask: "*",
    validate: (value) => (value.trim() ? true : "Paste your API key."),
  }).then((value) => value.trim());
}

async function verifyLoop(apiKey: string): Promise<void> {
  for (;;) {
    log.step("Checking the key against the Gemini API…");
    const result = await checkAccess(apiKey);
    reportAccess(result);
    if (result.status === "ok") return;
    const next = await select({
      message: "What next?",
      choices: [
        { name: "Check again", value: "retry" },
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
  const existing = await findApiKey();
  if (existing?.source === "env") log.info(`  ${API_KEY_ENV} is set in this shell (${maskKey(existing.apiKey)}); the server prefers it over a stored key.`);

  const stored = existing?.source === "config" ? existing.apiKey : undefined;
  const replace = !stored || (await confirm({ message: `A key is already stored (${maskKey(stored)}). Replace it?`, default: false }));

  let apiKey: string;
  if (replace) {
    apiKey = await promptApiKey();
    await storeApiKey(apiKey);
    log.success(`Key stored in ${pc.dim(configPath())} ${pc.dim("(owner read/write only)")}`);
  } else {
    apiKey = stored;
  }

  await verifyLoop(apiKey);
  await chooseAgents();
  log.info(`\n${pc.green("Done.")} Restart your agent so it picks up the new MCP server.`);
}
