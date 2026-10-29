import { GoogleGenAI } from "@google/genai";
import { resolveApiKey } from "./config";

export type Client = () => Promise<GoogleGenAI>;

export const createClient = (apiKey: string): GoogleGenAI => new GoogleGenAI({ apiKey });

export function lazyClient(): Client {
  let client: GoogleGenAI | undefined;
  return async () => (client ??= createClient(await resolveApiKey()));
}
