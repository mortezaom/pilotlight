import type { ApiResponse } from "./responses";

/** Fetches one of our API routes and unwraps `{ ok, data }`, throwing the API message on failure */
export async function apiFetch<T = unknown>(
  url: string,
  { json, ...init }: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    ...(json === undefined
      ? {}
      : {
          body: JSON.stringify(json),
          headers: { "Content-Type": "application/json" },
        }),
  });
  const body = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
  if (!body?.ok) {
    throw new Error(
      body?.ok === false ? body.message : `HTTP ${response.status}`
    );
  }
  return body.data;
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
