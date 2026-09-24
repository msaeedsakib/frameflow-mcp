import { randomUUID } from "node:crypto";
import { writeOutput } from "./media";

export type JobMedia = { data?: string; uri?: string; mimeType?: string };

export type JobPoll = () => Promise<{ done: false } | { done: true; media: JobMedia }>;

export type JobState =
  | { status: "running" }
  | { status: "done"; path: string; bytes: number; mime_type: string | undefined }
  | { status: "failed"; error: string };

export type Job = {
  id: string;
  tool: string;
  model: string;
  output_path: string;
  created_at: string;
  state: JobState;
};

type Downloader = (uri: string) => Promise<Uint8Array>;

export class Jobs {
  private readonly jobs = new Map<string, Job & { poll: JobPoll }>();

  constructor(private readonly download: Downloader) {}

  create(input: { tool: string; model: string; output_path: string; poll: JobPoll }): Job {
    const job = { id: randomUUID(), created_at: new Date().toISOString(), state: { status: "running" } as JobState, ...input };
    this.jobs.set(job.id, job);
    return this.view(job);
  }

  async check(id: string): Promise<Job> {
    const job = this.jobs.get(id);
    if (!job) throw new Error(`Unknown job ${id}. Jobs live in memory for the current server session only.`);
    if (job.state.status !== "running") return this.view(job);
    try {
      const result = await job.poll();
      if (result.done) {
        const bytes = await this.bytesOf(result.media);
        const written = await writeOutput(job.output_path, bytes);
        job.state = { status: "done", ...written, mime_type: result.media.mimeType };
      }
    } catch (error) {
      job.state = { status: "failed", error: error instanceof Error ? error.message : String(error) };
    }
    return this.view(job);
  }

  list(): Job[] {
    return [...this.jobs.values()].map((job) => this.view(job));
  }

  private async bytesOf(media: JobMedia): Promise<Uint8Array> {
    if (media.data) return Buffer.from(media.data, "base64");
    if (media.uri) return this.download(media.uri);
    throw new Error("The model returned no video data.");
  }

  private view({ poll: _poll, ...job }: Job & { poll: JobPoll }): Job {
    return { ...job };
  }
}
