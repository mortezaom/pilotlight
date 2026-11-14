import type { APIRoute } from "astro";
import { clearSessionCookie } from "@/lib/auth";
import { successResponse } from "@/lib/responses";
import { putSetting } from "@/lib/settings";

// Bumping the version revokes every session, not just this browser's
export const POST: APIRoute = async ({ cookies, locals }) => {
  if (locals.admin) {
    await putSetting("admin", {
      ...locals.admin,
      sessionVersion: locals.admin.sessionVersion + 1,
    });
  }
  clearSessionCookie(cookies);
  return successResponse({ redirect: "/login" });
};
