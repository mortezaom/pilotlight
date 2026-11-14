import type { APIRoute } from "astro";
import { z } from "zod/mini";
import { setSessionCookie } from "@/lib/auth";
import { comparePassword, hashPassword } from "@/lib/encryption";
import { authRateLimit } from "@/lib/rate-limit";
import { errorResponse, serverError, successResponse } from "@/lib/responses";
import { putSetting } from "@/lib/settings";

const passwordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().check(z.minLength(8)),
});

// Changing the password bumps the session version: every other session ends
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const limited = await authRateLimit(request);
    if (limited) {
      return limited;
    }
    const { admin } = locals;
    const body = passwordSchema.safeParse(await request.json());
    if (!(admin && body.success)) {
      return errorResponse(
        body.success ? "Unauthorized" : z.prettifyError(body.error),
        body.success ? 401 : 422
      );
    }
    if (!(await comparePassword(body.data.currentPassword, admin.password))) {
      return errorResponse("The current password is incorrect", 401);
    }

    const sessionVersion = admin.sessionVersion + 1;
    await putSetting("admin", {
      ...admin,
      password: await hashPassword(body.data.newPassword),
      sessionVersion,
    });
    await setSessionCookie(cookies, { email: admin.email, v: sessionVersion });
    return successResponse({ ok: true });
  } catch (error) {
    return serverError(error);
  }
};
