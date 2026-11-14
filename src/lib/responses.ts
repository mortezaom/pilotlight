export type ApiResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export const successResponse = (data: unknown, status = 200) =>
  Response.json({ data, ok: true }, { status });

export const errorResponse = (message: string, status: number) =>
  Response.json({ message, ok: false }, { status });

export const serverError = (error: unknown) => {
  console.error(error);
  return errorResponse("Something went wrong, check the Worker logs", 500);
};
