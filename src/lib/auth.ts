import type { AstroCookies } from "astro";
import {
  SESSION_TTL_SECONDS,
  type Session,
  signSession,
  verifySession,
} from "./encryption";
import { getSetting } from "./settings";

export const SESSION_COOKIE = "session";

export async function setSessionCookie(
  cookies: AstroCookies,
  session: Session
) {
  cookies.set(SESSION_COOKIE, await signSession(session), {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
}

export const clearSessionCookie = (cookies: AstroCookies) =>
  cookies.delete(SESSION_COOKIE, { path: "/" });

/** The signed-in admin, or null when the cookie is missing, invalid or revoked */
export async function currentAdmin(cookies: AstroCookies) {
  const session = await verifySession(cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return null;
  }
  const admin = await getSetting("admin");
  return admin?.email === session.email && admin.sessionVersion === session.v
    ? admin
    : null;
}
