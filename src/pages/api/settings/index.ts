import type { APIRoute } from "astro";
import { z } from "zod/mini";
import { errorResponse, serverError, successResponse } from "@/lib/responses";
import { getSetting, putSetting } from "@/lib/settings";

const settingsSchema = z.partial(
  z.object({
    // the cron runs every 5 minutes, so shorter intervals are impossible
    defaultMonitoringInterval: z.int().check(z.gte(5), z.lte(1440)),
    tcpCheckerUrl: z.union([z.literal(""), z.url()]),
  })
);

export const GET: APIRoute = async () => {
  try {
    return successResponse(await getSetting("settings"));
  } catch (error) {
    return serverError(error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = settingsSchema.safeParse(await request.json());
    if (!body.success) {
      return errorResponse(z.prettifyError(body.error), 422);
    }
    const current = await getSetting("settings");
    const settings = {
      defaultMonitoringInterval: 5,
      tcpCheckerUrl: "",
      ...current,
      ...body.data,
    };
    await putSetting("settings", settings);
    return successResponse(settings);
  } catch (error) {
    return serverError(error);
  }
};
