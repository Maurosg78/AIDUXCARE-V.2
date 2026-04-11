import { auth } from "../lib/firebase";

export async function buildAuthenticatedJsonHeaders(): Promise<Record<string, string>> {
  const currentAuth = auth;
  const canWaitForAuthState = typeof currentAuth?.authStateReady === "function";

  if (canWaitForAuthState) {
    await currentAuth.authStateReady();
  }

  const currentUser = currentAuth?.currentUser;
  if (!currentUser) {
    throw new Error("Authenticated Firebase user required for protected Cloud Function call.");
  }

  const idToken = await currentUser.getIdToken();
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${idToken}`,
  };

  return headers;
}
