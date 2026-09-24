import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { lazyClients } from "./clients";
import { downloadWithServiceAccount } from "./download";
import { Jobs } from "./jobs";
import { registerTools } from "./tools";
import { version } from "../package.json";

export function createServer(): McpServer {
  const server = new McpServer({ name: "FrameFlow MCP Server", version });
  registerTools(server, lazyClients(), new Jobs(downloadWithServiceAccount));
  return server;
}

export function serve(): void {
  serveStdio(createServer);
}
