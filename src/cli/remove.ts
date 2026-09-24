import { checkbox, confirm } from "@inquirer/prompts";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import pc from "picocolors";
import { agents } from "../agents";
import { keyPath } from "../paths";
import { log } from "./ui";

export async function remove(): Promise<void> {
  const installed = [];
  for (const agent of agents) {
    if (await agent.isInstalled().catch(() => false)) installed.push(agent);
  }

  if (installed.length === 0) {
    log.info("No agents have the frameflow MCP server configured.");
  } else {
    const selected = await checkbox({
      message: "Remove the MCP server and skill from:",
      choices: installed.map((agent) => ({ name: agent.label, value: agent.id, checked: true })),
    });
    for (const agent of installed.filter((agent) => selected.includes(agent.id))) {
      await agent.uninstall();
      log.success(`Removed from ${agent.label}`);
    }
  }

  if (existsSync(keyPath()) && (await confirm({ message: `Delete the stored key at ${keyPath()}?`, default: false }))) {
    await rm(keyPath(), { force: true });
    log.success(`Deleted ${pc.dim(keyPath())}`);
  }
}
