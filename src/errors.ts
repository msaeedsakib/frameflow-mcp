import { API_KEY_ENV, API_KEY_URL } from "./paths";

export function explain(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/^402\b|PAYMENT_REQUIRED/i.test(message)) {
    return "402 Payment required: this model needs billing enabled on the Google AI Studio project that owns the API key (aistudio.google.com → Settings → Billing).";
  }
  if (/API key not valid|API_KEY_INVALID/i.test(message)) {
    return `Google rejected the API key. Check ${API_KEY_ENV} in this server's MCP config, or create a new key at ${API_KEY_URL}.`;
  }
  return message;
}
