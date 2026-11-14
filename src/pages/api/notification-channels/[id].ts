import type { APIRoute } from "astro";
import { z } from "zod/mini";
import { updateChannelSchema } from "@/data/notification-channels-data";
import {
  deleteChannel,
  encryptCredentials,
  getChannel,
  saveChannel,
  toPublicChannel,
} from "@/lib/notifications";
import { errorResponse, serverError, successResponse } from "@/lib/responses";

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const channel = await getChannel(params.id ?? "");
    if (!channel) {
      return errorResponse("Channel not found", 404);
    }
    const body = updateChannelSchema.safeParse(await request.json());
    if (!body.success) {
      return errorResponse(z.prettifyError(body.error), 422);
    }

    const { name, enabled, credentials } = body.data;
    if (credentials && credentials.provider !== channel.provider) {
      return errorResponse("Channel provider can't be changed", 422);
    }
    const updated = {
      ...channel,
      credentials: credentials
        ? await encryptCredentials(credentials)
        : channel.credentials,
      enabled: enabled ?? channel.enabled,
      name: name ?? channel.name,
      updatedAt: new Date().toISOString(),
    };
    await saveChannel(updated);
    return successResponse(await toPublicChannel(updated));
  } catch (error) {
    return serverError(error);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = params.id ?? "";
    if (!(await getChannel(id))) {
      return errorResponse("Channel not found", 404);
    }
    await deleteChannel(id);
    return successResponse({ id });
  } catch (error) {
    return serverError(error);
  }
};
