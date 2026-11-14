import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { z } from "zod/mini";
import { setupSchema } from "@/data/auth-form-data";
import { setSessionCookie } from "@/lib/auth";
import { hashPassword, safeEqualText } from "@/lib/encryption";
import { authRateLimit } from "@/lib/rate-limit";
import { errorResponse, serverError, successResponse } from "@/lib/responses";
import { getSetting, putSetting } from "@/lib/settings";

// The one-time SETUP_SECRET proves ownership; the admin email is chosen here
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const limited = await authRateLimit(request);
    if (limited) {
      return limited;
    }
    if (await getSetting("admin")) {
      return errorResponse("Dashboard is already initialized", 400);
    }

    const body = setupSchema.safeParse(await request.json());
    if (!body.success) {
      return errorResponse(z.prettifyError(body.error), 422);
    }

    const { email, password, secret } = body.data;
    if (!(env.SETUP_SECRET && safeEqualText(secret, env.SETUP_SECRET))) {
      return errorResponse("Invalid setup secret", 401);
    }

    await putSetting("admin", {
      email,
      password: await hashPassword(password),
      sessionVersion: 1,
    });
    await setSessionCookie(cookies, { email, v: 1 });
    return successResponse({ redirect: "/dashboard" });
  } catch (error) {
    return serverError(error);
  }
};
