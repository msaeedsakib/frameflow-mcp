import { describe, expect, test } from "bun:test";
import { stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseServiceAccount, readServiceAccount, storeServiceAccount } from "../src/credentials";
import { keyPath, normalizePath } from "../src/paths";
import { serviceAccount, useTempHome } from "./helpers";

const home = useTempHome();

describe("parseServiceAccount", () => {
  test("accepts a service account key and keeps extra fields", () => {
    expect(parseServiceAccount(JSON.stringify(serviceAccount))).toEqual(serviceAccount);
  });

  test("rejects invalid JSON", () => {
    expect(() => parseServiceAccount("{nope")).toThrow("not valid JSON");
  });

  test("rejects OAuth client files", () => {
    expect(() => parseServiceAccount(JSON.stringify({ installed: { client_id: "x" } }))).toThrow("Not a service account key");
  });
});

describe("normalizePath", () => {
  test("strips drag-and-drop quotes and escaped spaces", () => {
    expect(normalizePath("'/tmp/my key.json'")).toBe("/tmp/my key.json");
    expect(normalizePath("/tmp/my\\ key.json ")).toBe("/tmp/my key.json");
  });

  test("expands ~", () => {
    expect(normalizePath("~/key.json")).toBe(join(home.path, "key.json"));
  });
});

test("storeServiceAccount writes an owner-only file under the config dir", async () => {
  const source = join(home.path, "download.json");
  await writeFile(source, JSON.stringify(serviceAccount));
  const stored = await storeServiceAccount(await readServiceAccount(source));
  expect(stored).toBe(join(home.path, ".config", "frameflow-mcp", "service-account.json"));
  expect(stored).toBe(keyPath());
  expect((await stat(stored)).mode & 0o777).toBe(0o600);
  expect(await readServiceAccount(stored)).toEqual(serviceAccount);
});
