import { z } from "zod/mini";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().check(z.minLength(8)),
});
export type LoginSchemaType = z.infer<typeof loginSchema>;

export const setupSchema = z.extend(loginSchema, {
  secret: z.string().check(z.trim(), z.minLength(1)),
});
export type SetupSchemaType = z.infer<typeof setupSchema>;

// Shared client form: the secret field is only shown (and required by the API) during setup
export const authFormSchema = z.extend(loginSchema, {
  secret: z.optional(z.string()),
});
export type AuthFormType = z.infer<typeof authFormSchema>;
