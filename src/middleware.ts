import { defineMiddleware } from "astro:middleware";
import { currentAdmin } from "./lib/auth";
import { errorResponse } from "./lib/responses";

const PUBLIC_API = new Set(["/api/setup", "/api/login", "/api/health"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const isProtected = (path: string) =>
  path === "/dashboard" ||
  path.startsWith("/dashboard/") ||
  (path.startsWith("/api/") && !PUBLIC_API.has(path));

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // CSRF: state-changing API calls must come from our own pages
  if (
    pathname.startsWith("/api/") &&
    !SAFE_METHODS.has(context.request.method) &&
    context.request.headers.get("Origin") !== context.url.origin
  ) {
    return errorResponse("Cross-origin request blocked", 403);
  }

  if (isProtected(pathname) || pathname === "/login") {
    context.locals.admin = await currentAdmin(context.cookies);
  }
  if (isProtected(pathname) && !context.locals.admin) {
    return pathname.startsWith("/api/")
      ? errorResponse("Unauthorized", 401)
      : context.redirect("/login");
  }
  if (pathname === "/login" && context.locals.admin) {
    return context.redirect("/dashboard");
  }

  const response = await next();
  // Workers Cache stores anything without this; only pages that opt in are public
  if (!response.headers.has("Cache-Control")) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
});
