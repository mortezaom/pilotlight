import { z } from "zod/mini";

export const brandingSchema = z.object({
  announcement: z.string().check(z.trim(), z.maxLength(200)),
  description: z.string().check(z.trim(), z.minLength(2)),
  title: z.string().check(z.trim(), z.minLength(2)),
});
export type BrandingSchemaType = z.infer<typeof brandingSchema>;
