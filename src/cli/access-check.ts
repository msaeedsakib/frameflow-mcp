import { createClient } from "../clients";

export type AccessResult = { status: "ok" } | { status: "error"; message: string };

const PROBE_MODEL = "gemini-3.1-flash-image";

export function classifyError(error: unknown): AccessResult {
  const message = error instanceof Error ? error.message : String(error);
  if (/API key not valid|API_KEY_INVALID|UNAUTHENTICATED|401|403/i.test(message)) {
    return { status: "error", message: "Google rejected this API key. Check it in Google AI Studio or create a new one." };
  }
  return { status: "error", message };
}

export async function checkAccess(apiKey: string): Promise<AccessResult> {
  try {
    await createClient(apiKey).models.get({ model: PROBE_MODEL });
    return { status: "ok" };
  } catch (error) {
    return classifyError(error);
  }
}
