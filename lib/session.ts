import { cookies } from "next/headers";

export const SESSION_COOKIE = "llx_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Read the existing session ID from the cookie, or create a new one.
 * Must be called from a Server Action or Server Component.
 */
export async function getOrCreateSession(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return sessionId;
}

/**
 * Read the session ID without creating one. Returns undefined if not set.
 */
export async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

/**
 * Parse session ID from a raw Cookie header (for Route Handlers that
 * receive a Request object instead of using next/headers).
 */
export function getSessionIdFromCookie(cookieHeader: string): string | undefined {
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`),
  );
  return match?.[1];
}
