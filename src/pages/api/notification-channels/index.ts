import type { APIRoute } from "astro";
import { z } from "zod/mini";
import { createChannelSchema } from "@/data/notification-channels-data";
import {
  encryptCredentials,
  getAllChannels,
  saveChannel,
  toPublicChannel,
} from "@/lib/notifications";
import { errorResponse, serverError, successResponse } from "@/lib/responses";

export const GET: APIRoute = async () => {
  try {
    const channels = await getAllChannels();
    return successResponse(await Promise.all(channels.map(toPublicChannel)));
  } catch (error) {
    return serverError(error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = createChannelSchema.safeParse(await request.json());
    if (!body.success) {
      return errorResponse(z.prettifyError(body.error), 422);
    }

    const { name, enabled, credentials } = body.data;
    const now = new Date().toISOString();
    const channel = {
      createdAt: now,
      credentials: await encryptCredentials(credentials),
      enabled: enabled ?? true,
      id: crypto.randomUUID(),
      name,
      provider: credentials.provider,
      updatedAt: now,
    };
    await saveChannel(channel);
    return successResponse(await toPublicChannel(channel), 201);
  } catch (error) {
    return serverError(error);
  }
};
