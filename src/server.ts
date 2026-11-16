import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { lazyClient } from "./clients";
import { downloadFile } from "./interactions";
import { Jobs } from "./jobs";
import { registerTools } from "./tools";
import { instructions } from "./tools/descriptions";
import { version } from "../package.json";

export function createServer(): McpServer {
  const server = new McpServer({ name: "FrameFlow MCP Server", version }, { instructions });
  const client = lazyClient();
  registerTools(server, client, new Jobs(async (uri) => downloadFile(await client(), uri)));
  return server;
}

export function serve(): void {
  const toStderr = (...args: unknown[]) => console.error(...args);
  console.log = toStderr;
  console.info = toStderr;
  console.debug = toStderr;
  console.warn = toStderr;
  serveStdio(createServer);
}
