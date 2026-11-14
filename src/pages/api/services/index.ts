import type { APIRoute } from "astro";
import { z } from "zod/mini";
import { serviceSchema } from "@/data/services-data";
import { getServicesWithStatus, saveService } from "@/data/services-storage";
import { errorResponse, serverError, successResponse } from "@/lib/responses";

export const GET: APIRoute = async () => {
  try {
    return successResponse(await getServicesWithStatus());
  } catch (error) {
    return serverError(error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = serviceSchema.safeParse(
      await request.json().catch(() => null)
    );
    if (!body.success) {
      return errorResponse(z.prettifyError(body.error), 422);
    }
    const service = await saveService(body.data);
    return service
      ? successResponse(service, 201)
      : errorResponse("Service not found", 404);
  } catch (error) {
    return serverError(error);
  }
};
