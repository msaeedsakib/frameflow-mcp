#!/usr/bin/env node
import { version } from "../package.json";
import { serve } from "./server";

if (process.argv.length > 2) {
  console.error(
    `frameflow-mcp ${version} takes no arguments; it runs as an MCP server over stdio. setup, status and remove were removed in 0.3.1: add the server with GEMINI_API_KEY in its env, see https://github.com/msaeedsakib/frameflow-mcp#install`,
  );
  process.exit(1);
}

serve();
