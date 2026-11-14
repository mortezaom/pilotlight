import type { APIRoute } from "astro";
import { z } from "zod/mini";
import { brandingSchema } from "@/data/branding-data";
import { logoError, logoToDataUri } from "@/lib/logo";
import { errorResponse, serverError, successResponse } from "@/lib/responses";
import { getSetting, putSetting } from "@/lib/settings";

// "image" is a File (new logo), "removed" (delete logo) or absent (keep current)
export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const body = brandingSchema.safeParse(Object.fromEntries(formData));
    if (!body.success) {
      return errorResponse(z.prettifyError(body.error), 422);
    }

    const image = formData.get("image");
    let imageUrl: string | null = null;
    if (image instanceof File) {
      const error = logoError(image);
      if (error) {
        return errorResponse(error, 422);
      }
      imageUrl = await logoToDataUri(image);
    } else if (image !== "removed") {
      imageUrl = (await getSetting("branding"))?.imageUrl ?? null;
    }

    const branding = { ...body.data, imageUrl };
    await putSetting("branding", branding);
    return successResponse(branding, 201);
  } catch (error) {
    return serverError(error);
  }
};
