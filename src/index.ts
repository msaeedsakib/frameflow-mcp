#!/usr/bin/env node
import { Command } from "commander";
import { version } from "../package.json";
import { remove } from "./cli/remove";
import { setup } from "./cli/setup";
import { status } from "./cli/status";
import { serve } from "./server";

const exitOnCancel = (run: () => Promise<void>) => async () => {
  try {
    await run();
  } catch (error) {
    if (error instanceof Error && error.name === "ExitPromptError") process.exit(130);
    throw error;
  }
};

const program = new Command()
  .name("frameflow-mcp")
  .description("FrameFlow MCP server for Google image and video models. Run without a command to start the stdio server.")
  .version(version)
  .action(serve);

program.command("setup").description("Store a service account key and configure your AI agents").action(exitOnCancel(setup));
program.command("status").description("Show the stored key, configured agents and verify access").action(exitOnCancel(status));
program.command("remove").description("Remove the MCP server and skill from agents, optionally delete the key").action(exitOnCancel(remove));

await program.parseAsync();
