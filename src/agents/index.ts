import { existsSync } from "node:fs";
import { join } from "node:path";
import { isPlainObject } from "../case";
import { home, PACKAGE_NAME, SERVER_NAME } from "../paths";
import { installSkill, readJsonObject, readText, uninstallSkill, updateJsonServers, writeText } from "./files";
import { appendTomlTable, hasTomlTable, removeTomlTable } from "./toml";

export const serverCommand = { command: "npx", args: ["-y", PACKAGE_NAME] };

export type Agent = {
  id: "claude" | "cursor" | "codex";
  label: string;
  configPath: () => string;
  skillsDir: () => string;
  detected: () => boolean;
  isInstalled: () => Promise<boolean>;
  install: () => Promise<void>;
  uninstall: () => Promise<void>;
};

function jsonAgent(options: {
  id: Agent["id"];
  label: string;
  configPath: () => string;
  skillsDir: () => string;
  homeDir: () => string;
  entry: Record<string, unknown>;
}): Agent {
  const { configPath, skillsDir } = options;
  return {
    id: options.id,
    label: options.label,
    configPath,
    skillsDir,
    detected: () => existsSync(options.homeDir()) || existsSync(configPath()),
    isInstalled: async () => {
      const servers = (await readJsonObject(configPath())).mcpServers;
      return isPlainObject(servers) && SERVER_NAME in servers;
    },
    install: async () => {
      await updateJsonServers(configPath(), "mcpServers", (servers) => {
        servers[SERVER_NAME] = options.entry;
      });
      await installSkill(skillsDir());
    },
    uninstall: async () => {
      if (existsSync(configPath())) {
        await updateJsonServers(configPath(), "mcpServers", (servers) => {
          delete servers[SERVER_NAME];
        });
      }
      await uninstallSkill(skillsDir());
    },
  };
}

const claudeDir = () => process.env.CLAUDE_CONFIG_DIR || join(home(), ".claude");
const cursorDir = () => join(home(), ".cursor");
const codexDir = () => process.env.CODEX_HOME || join(home(), ".codex");
const codexTable = `mcp_servers.${SERVER_NAME}`;
const codexConfig = () => join(codexDir(), "config.toml");
const codexSkills = () => join(home(), ".agents", "skills");

const codexBlock = `[${codexTable}]
command = ${JSON.stringify(serverCommand.command)}
args = [${serverCommand.args.map((arg) => JSON.stringify(arg)).join(", ")}]
startup_timeout_sec = 60
`;

export const agents: Agent[] = [
  jsonAgent({
    id: "claude",
    label: "Claude Code",
    configPath: () =>
      process.env.CLAUDE_CONFIG_DIR ? join(claudeDir(), ".claude.json") : join(home(), ".claude.json"),
    skillsDir: () => join(claudeDir(), "skills"),
    homeDir: claudeDir,
    entry: { type: "stdio", ...serverCommand, env: {} },
  }),
  jsonAgent({
    id: "cursor",
    label: "Cursor",
    configPath: () => join(cursorDir(), "mcp.json"),
    skillsDir: () => join(cursorDir(), "skills"),
    homeDir: cursorDir,
    entry: serverCommand,
  }),
  {
    id: "codex",
    label: "Codex",
    configPath: codexConfig,
    skillsDir: codexSkills,
    detected: () => existsSync(codexDir()),
    isInstalled: async () => hasTomlTable((await readText(codexConfig())) ?? "", codexTable),
    install: async () => {
      const raw = (await readText(codexConfig())) ?? "";
      await writeText(codexConfig(), appendTomlTable(removeTomlTable(raw, codexTable), codexBlock));
      await installSkill(codexSkills());
    },
    uninstall: async () => {
      const raw = await readText(codexConfig());
      if (raw !== null) await writeText(codexConfig(), `${removeTomlTable(raw, codexTable).trimEnd()}\n`);
      await uninstallSkill(codexSkills());
    },
  },
];

export const genericSnippet = JSON.stringify({ mcpServers: { [SERVER_NAME]: serverCommand } }, null, 2);
