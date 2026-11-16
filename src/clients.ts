import { GoogleGenAI } from "@google/genai";
import { API_KEY_ENV, API_KEY_URL } from "./paths";

export type Client = () => Promise<GoogleGenAI>;

export function lazyClient(): Client {
  let client: GoogleGenAI | undefined;
  return async () => {
    if (client) return client;
    const apiKey = process.env[API_KEY_ENV]?.trim();
    if (!apiKey) throw new Error(`${API_KEY_ENV} is not set. Add it to this server's env in your MCP config (get a key at ${API_KEY_URL}).`);
    return (client = new GoogleGenAI({ apiKey }));
  };
}
