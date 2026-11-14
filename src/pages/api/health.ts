import type { APIRoute } from "astro";
import { count, max } from "drizzle-orm";
import { getDb } from "@/db";
import { monitoringResults, services } from "@/db/schema";

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    // max(timestamp) is answered from the timestamp index, not a table scan
    const [[serviceStats], [checkStats]] = await db.batch([
      db.select({ total: count() }).from(services),
      db
        .select({ lastCheck: max(monitoringResults.timestamp) })
        .from(monitoringResults),
    ]);
    return Response.json({
      lastCheck: checkStats.lastCheck,
      services: serviceStats.total,
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { status: "unhealthy", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
};
