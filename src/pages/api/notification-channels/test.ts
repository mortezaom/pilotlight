import type { APIRoute } from "astro";
import { z } from "zod/mini";
import { credentialsSchema } from "@/data/notification-channels-data";
import { sendTestNotification } from "@/lib/notifications";
import { errorResponse, successResponse } from "@/lib/responses";

export const POST: APIRoute = async ({ request }) => {
  const body = z
    .object({ credentials: credentialsSchema })
    .safeParse(await request.json());
  if (!body.success) {
    return errorResponse(z.prettifyError(body.error), 422);
  }

  try {
    await sendTestNotification(body.data.credentials);
    return successResponse({ message: "Test notification sent successfully!" });
  } catch (error) {
    return errorResponse(
      `Test failed: ${error instanceof Error ? error.message : String(error)}`,
      400
    );
  }
};
