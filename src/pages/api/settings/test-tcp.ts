import type { APIRoute } from "astro";
import { z } from "zod/mini";
import { checkService } from "@/lib/monitoring";
import { errorResponse, successResponse } from "@/lib/responses";

// Server-side, so the checker doesn't need CORS for the dashboard's origin
export const POST: APIRoute = async ({ request }) => {
  const body = z
    .object({ tcpCheckerUrl: z.url() })
    .safeParse(await request.json());
  if (!body.success) {
    return errorResponse(z.prettifyError(body.error), 422);
  }
  const result = await checkService(
    {
      address: "1.1.1.1",
      id: 0,
      name: "TCP checker test",
      port: 53,
      public: false,
      showAddress: false,
      type: "tcp",
    },
    body.data.tcpCheckerUrl
  );
  return result.status === "up"
    ? successResponse({ responseTime: result.responseTime })
    : errorResponse(
        `TCP checker test failed: ${result.errorMessage ?? result.status}`,
        400
      );
};
