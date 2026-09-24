import { GoogleGenAI } from "@google/genai";
import type { ServiceAccount } from "./credentials";
import { loadStoredServiceAccount } from "./credentials";
import { PACKAGE_NAME } from "./paths";

export function createClient(account: ServiceAccount, location: string): GoogleGenAI {
  return new GoogleGenAI({
    vertexai: true,
    project: account.project_id,
    location,
    googleAuthOptions: {
      credentials: { client_email: account.client_email, private_key: account.private_key },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    },
  });
}

export type ClientFor = (location: string) => Promise<GoogleGenAI>;

export function lazyClients(): ClientFor {
  const clients = new Map<string, GoogleGenAI>();
  let account: ServiceAccount | null = null;
  return async (location) => {
    const cached = clients.get(location);
    if (cached) return cached;
    account ??= await loadStoredServiceAccount();
    if (!account) throw new Error(`No service account key found. Run \`npx ${PACKAGE_NAME} setup\` first.`);
    const client = createClient(account, location);
    clients.set(location, client);
    return client;
  };
}
