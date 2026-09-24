import { expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { mimeTypeOf, readInlineMedia, writeOutput } from "../src/media";
import { useTempHome } from "./helpers";

const home = useTempHome();

test("mime type by extension", () => {
  expect(mimeTypeOf("/x/a.PNG")).toBe("image/png");
  expect(mimeTypeOf("/x/a.mp4")).toBe("video/mp4");
  expect(() => mimeTypeOf("/x/a.txt")).toThrow("Unsupported file type");
});

test("reads a local file as base64 with ~ expansion", async () => {
  await writeFile(join(home.path, "in.jpg"), Buffer.from([1, 2, 3]));
  expect(await readInlineMedia("~/in.jpg")).toEqual({ data: Buffer.from([1, 2, 3]).toString("base64"), mimeType: "image/jpeg" });
  await expect(readInlineMedia("~/missing.jpg")).rejects.toThrow("Cannot read");
});

test("writes output creating parent directories", async () => {
  const written = await writeOutput("~/out/nested/clip.mp4", new Uint8Array([9, 8]));
  expect(written).toEqual({ path: join(home.path, "out", "nested", "clip.mp4"), bytes: 2 });
  expect([...(await readFile(written.path))]).toEqual([9, 8]);
});
