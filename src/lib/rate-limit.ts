import { env } from "cloudflare:workers";
import { errorResponse } from "./responses";

/** 5 attempts per minute per IP for login/setup; null when allowed */
export async function authRateLimit(request: Request) {
  const key = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const { success } = await env.AUTH_LIMITER.limit({ key });
  return success
    ? null
    : errorResponse("Too many attempts, try again in a minute", 429);
}
