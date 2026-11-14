import type { APIRoute } from "astro";
import { z } from "zod/mini";
import {
  getAllChannels,
  getServiceMappings,
  saveServiceMappings,
} from "@/lib/notifications";
import { errorResponse, serverError, successResponse } from "@/lib/responses";

const alertsSchema = z.object({
  alertThreshold: z.int().check(z.gte(1), z.lte(20)),
  channelIds: z.array(z.string()),
  notifyOnRecovery: z.boolean(),
});

export const GET: APIRoute = async ({ params }) => {
  try {
    return successResponse(await getServiceMappings(Number(params.id)));
  } catch (error) {
    return serverError(error);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const serviceId = Number(params.id);
    const body = alertsSchema.safeParse(await request.json());
    if (!(Number.isInteger(serviceId) && body.success)) {
      return errorResponse(
        body.success ? "Invalid service ID" : z.prettifyError(body.error),
        422
      );
    }

    const known = new Set((await getAllChannels()).map((ch) => ch.id));
    const { channelIds, alertThreshold, notifyOnRecovery } = body.data;
    const mappings = [...new Set(channelIds)]
      .filter((channelId) => known.has(channelId))
      .map((channelId) => ({
        alertThreshold,
        channelId,
        notifyOnRecovery,
        serviceId,
      }));

    await saveServiceMappings(serviceId, mappings);
    return successResponse(mappings);
  } catch (error) {
    return serverError(error);
  }
};
