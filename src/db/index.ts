import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
// biome-ignore lint/performance/noNamespaceImport: drizzle needs the whole schema
import * as schema from "./schema";

export const getDb = (d1: D1Database = env.DB) => drizzle(d1, { schema });

export type Database = ReturnType<typeof getDb>;
