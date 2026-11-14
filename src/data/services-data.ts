import { z } from "zod/mini";

const ipRegex =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\.(?!$)|$)){4}$|^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/u;

const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]{1,63}\.)+[a-zA-Z]{2,}$/u;

export const serviceSchema = z.object({
  address: z.string().check(
    z.trim(),
    z.refine(
      (val) => ipRegex.test(val) || domainRegex.test(val),
      "Must be a valid IP address or domain"
    )
  ),
  id: z.optional(z.number()),
  name: z.string().check(z.trim(), z.minLength(2), z.maxLength(50)),
  port: z.int().check(z.gte(1), z.lte(65_535)),
  public: z.boolean(),
  showAddress: z.boolean(),
  type: z.enum(["https", "http", "tcp"]),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export const STATUS_LABELS = {
  down: "Down",
  error: "Error",
  timeout: "Timeout",
  up: "Operational",
} as const;
