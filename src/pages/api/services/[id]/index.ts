import type { APIRoute } from "astro";
import { deleteService } from "@/data/services-storage";
import { errorResponse, serverError, successResponse } from "@/lib/responses";

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return errorResponse("Invalid service ID", 400);
    }
    const deleted = await deleteService(id);
    return deleted
      ? successResponse(deleted)
      : errorResponse("Service not found", 404);
  } catch (error) {
    return serverError(error);
  }
};
