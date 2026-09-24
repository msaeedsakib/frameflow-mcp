import { GoogleAuth } from "google-auth-library";
import { loadStoredServiceAccount } from "./credentials";

export async function downloadWithServiceAccount(uri: string): Promise<Uint8Array> {
  if (uri.startsWith("gs://")) throw new Error(`Output was written to ${uri}; Cloud Storage delivery is not supported by this server.`);
  const account = await loadStoredServiceAccount();
  if (!account) throw new Error("No service account key found.");
  const auth = new GoogleAuth({
    credentials: { client_email: account.client_email, private_key: account.private_key },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const token = await auth.getAccessToken();
  const response = await fetch(uri, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  return new Uint8Array(await response.arrayBuffer());
}
