import { createClient } from "../clients";
import type { ServiceAccount } from "../credentials";

export type AccessResult =
  | { status: "ok"; model: string }
  | { status: "api-disabled"; api: string; url: string }
  | { status: "error"; message: string };

const API = "aiplatform.googleapis.com";
const PROBE_MODEL = "gemini-3.1-flash-image";

export function classifyError(error: unknown, projectId: string): AccessResult {
  const message = error instanceof Error ? error.message : String(error);
  if (/SERVICE_DISABLED|has not been used in project|it is disabled/i.test(message)) {
    return {
      status: "api-disabled",
      api: "Vertex AI API (Gemini Enterprise Agent Platform)",
      url: `https://console.cloud.google.com/apis/library/${API}?project=${projectId}`,
    };
  }
  if (/UNAUTHENTICATED|invalid_grant|invalid_client|account not found/i.test(message)) {
    return { status: "error", message: "Google rejected this key. It may have been deleted or disabled; create a new key." };
  }
  if (/PERMISSION_DENIED|403/i.test(message)) {
    return {
      status: "error",
      message: `Permission denied. Grant the service account the Vertex AI User role (roles/aiplatform.user) in project ${projectId}.`,
    };
  }
  return { status: "error", message };
}

export async function checkAccess(account: ServiceAccount): Promise<AccessResult> {
  try {
    const model = await createClient(account, "global").models.get({ model: PROBE_MODEL });
    return { status: "ok", model: model.name ?? PROBE_MODEL };
  } catch (error) {
    return classifyError(error, account.project_id);
  }
}
