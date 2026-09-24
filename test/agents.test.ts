import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "smol-toml";
import { agents } from "../src/agents";
import { useTempHome } from "./helpers";

const home = useTempHome();
const agent = (id: string) => {
  const found = agents.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`unknown agent ${id}`);
  return found;
};
const readJson = async (path: string) => JSON.parse(await readFile(path, "utf8"));

describe.each(["claude", "cursor"])("%s", (id) => {
  test("install merges into existing config and copies the skill; uninstall reverts", async () => {
    const target = agent(id);
    await mkdir(join(target.configPath(), ".."), { recursive: true });
    await writeFile(target.configPath(), JSON.stringify({ theme: "dark", mcpServers: { other: { command: "x" } } }));

    await target.install();
    const installed = await readJson(target.configPath());
    expect(installed.theme).toBe("dark");
    expect(installed.mcpServers.other).toEqual({ command: "x" });
    expect(installed.mcpServers.frameflow.args).toEqual(["-y", "@saeedsakib/frameflow-mcp"]);
    expect(await target.isInstalled()).toBe(true);
    expect(existsSync(join(target.skillsDir(), "frameflow-mcp", "SKILL.md"))).toBe(true);

    await target.uninstall();
    const removed = await readJson(target.configPath());
    expect(removed.mcpServers).toEqual({ other: { command: "x" } });
    expect(await target.isInstalled()).toBe(false);
    expect(existsSync(join(target.skillsDir(), "frameflow-mcp"))).toBe(false);
  });
});

test("claude honours CLAUDE_CONFIG_DIR", async () => {
  process.env.CLAUDE_CONFIG_DIR = join(home.path, "alt");
  await agent("claude").install();
  expect(existsSync(join(home.path, "alt", ".claude.json"))).toBe(true);
  expect(existsSync(join(home.path, "alt", "skills", "frameflow-mcp", "SKILL.md"))).toBe(true);
});

describe("codex", () => {
  const existing = `# my settings
model = "gpt-5"

[mcp_servers.frameflow]
command = "old"

[mcp_servers.frameflow.env]
FOO = "bar"

[mcp_servers.other]
command = "keep"
`;

  test("install replaces its own table and preserves the rest, including comments", async () => {
    const codex = agent("codex");
    await mkdir(join(home.path, ".codex"), { recursive: true });
    await writeFile(codex.configPath(), existing);

    await codex.install();
    const raw = await readFile(codex.configPath(), "utf8");
    expect(raw).toContain("# my settings");
    const parsed = parse(raw) as { model: string; mcp_servers: Record<string, Record<string, unknown>> };
    expect(parsed.model).toBe("gpt-5");
    expect(parsed.mcp_servers.other).toEqual({ command: "keep" });
    expect(parsed.mcp_servers.frameflow).toEqual({ command: "npx", args: ["-y", "@saeedsakib/frameflow-mcp"], startup_timeout_sec: 60 });
    expect(existsSync(join(home.path, ".agents", "skills", "frameflow-mcp", "SKILL.md"))).toBe(true);

    await codex.uninstall();
    const after = parse(await readFile(codex.configPath(), "utf8")) as { mcp_servers: Record<string, unknown> };
    expect(Object.keys(after.mcp_servers)).toEqual(["other"]);
    expect(await codex.isInstalled()).toBe(false);
  });

  test("install creates a fresh config", async () => {
    await agent("codex").install();
    expect(await agent("codex").isInstalled()).toBe(true);
  });
});
