import type { APIRoute } from "astro";
import { z } from "zod/mini";
import { loginSchema } from "@/data/auth-form-data";
import { setSessionCookie } from "@/lib/auth";
import { comparePassword } from "@/lib/encryption";
import { authRateLimit } from "@/lib/rate-limit";
import { errorResponse, serverError, successResponse } from "@/lib/responses";
import { getSetting } from "@/lib/settings";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const limited = await authRateLimit(request);
    if (limited) {
      return limited;
    }
    const body = loginSchema.safeParse(await request.json());
    if (!body.success) {
      return errorResponse(z.prettifyError(body.error), 422);
    }

    const { email, password } = body.data;
    const admin = await getSetting("admin");
    // compare first so the response time doesn't reveal whether the email matched
    const validPassword =
      !!admin && (await comparePassword(password, admin.password));
    if (!(validPassword && admin?.email === email)) {
      return errorResponse("Email or Password is incorrect!", 401);
    }

    await setSessionCookie(cookies, { email, v: admin.sessionVersion });
    return successResponse({ redirect: "/dashboard" });
  } catch (error) {
    return serverError(error);
  }
};
