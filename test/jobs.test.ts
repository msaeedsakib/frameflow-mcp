import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Jobs, type JobPoll } from "../src/jobs";
import { useTempHome } from "./helpers";

const home = useTempHome();
const base = { tool: "generate_video", model: "gemini-omni-1.1-flash" };

test("running until the poll reports data, then writes the file once", async () => {
  let calls = 0;
  const poll: JobPoll = async () => (++calls < 2 ? { done: false } : { done: true, media: { data: Buffer.from("mp4!").toString("base64"), mimeType: "video/mp4" } });
  const jobs = new Jobs(async () => new Uint8Array());
  const job = jobs.create({ ...base, output_path: "~/clip.mp4", poll });
  expect(job.state).toEqual({ status: "running" });
  expect((await jobs.check(job.id)).state.status).toBe("running");
  const done = await jobs.check(job.id);
  expect(done.state).toEqual({ status: "done", path: join(home.path, "clip.mp4"), bytes: 4, mime_type: "video/mp4" });
  expect(await readFile(join(home.path, "clip.mp4"), "utf8")).toBe("mp4!");
  await jobs.check(job.id);
  expect(calls).toBe(2);
});

test("downloads by uri when no inline data", async () => {
  const jobs = new Jobs(async (uri) => new TextEncoder().encode(`from ${uri}`));
  const job = jobs.create({ ...base, output_path: "~/u.mp4", poll: async () => ({ done: true, media: { uri: "https://x/y" } }) });
  const done = await jobs.check(job.id);
  expect(done.state.status).toBe("done");
  expect(await readFile(join(home.path, "u.mp4"), "utf8")).toBe("from https://x/y");
});

test("poll errors mark the job failed and unknown ids throw", async () => {
  const jobs = new Jobs(async () => new Uint8Array());
  const job = jobs.create({ ...base, output_path: "~/f.mp4", poll: async () => { throw new Error("filtered"); } });
  expect((await jobs.check(job.id)).state).toEqual({ status: "failed", error: "filtered" });
  await expect(jobs.check("nope")).rejects.toThrow("Unknown job nope");
});
