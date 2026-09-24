import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { keyPath } from "./paths";

const serviceAccountSchema = z.looseObject({
  type: z.literal("service_account"),
  project_id: z.string().min(1),
  client_email: z.string().min(1),
  private_key: z.string().includes("PRIVATE KEY"),
});

export type ServiceAccount = z.infer<typeof serviceAccountSchema>;

export function parseServiceAccount(text: string): ServiceAccount {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON.");
  }
  const result = serviceAccountSchema.safeParse(json);
  if (!result.success) {
    throw new Error(
      "Not a service account key. Download a JSON key from Google Cloud Console → IAM & Admin → Service Accounts → Keys.",
    );
  }
  return result.data;
}

export async function readServiceAccount(path: string): Promise<ServiceAccount> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch {
    throw new Error(`Cannot read ${path}.`);
  }
  return parseServiceAccount(text);
}

export async function storeServiceAccount(account: ServiceAccount, target = keyPath()): Promise<string> {
  await mkdir(dirname(target), { recursive: true, mode: 0o700 });
  await writeFile(target, JSON.stringify(account, null, 2), { mode: 0o600 });
  await chmod(target, 0o600);
  return target;
}

export async function loadStoredServiceAccount(path = keyPath()): Promise<ServiceAccount | null> {
  try {
    return await readServiceAccount(path);
  } catch {
    return null;
  }
}
