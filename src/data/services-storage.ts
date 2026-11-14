import { count, desc, eq, gte, sql } from "drizzle-orm";
import { type Database, getDb } from "@/db";
import {
  incidents,
  monitoringResults,
  type ServiceStatus,
  serviceAlerts,
  services,
} from "@/db/schema";
import type { ServiceInput } from "./services-data";

export type CheckPoint = {
  status: ServiceStatus;
  timestamp: string;
  responseTime: number | null;
  errorMessage: string | null;
};

export type ServiceWithStatus = typeof services.$inferSelect & {
  status?: ServiceStatus;
  uptime?: number; // % over the last 24h
  lastCheck?: string;
  responseTime?: number;
  history: CheckPoint[]; // oldest first
};

const DAY_MS = 24 * 60 * 60 * 1000;
export const HISTORY_LENGTH = 50;

/** Latest `limit` checks per service, newest first (one index-backed query each, one round trip) */
export async function getRecentChecks(
  db: Database,
  serviceIds: number[],
  limit: number
): Promise<Map<number, CheckPoint[]>> {
  if (serviceIds.length === 0) {
    return new Map();
  }
  const queries = serviceIds.map((id) =>
    db
      .select({
        errorMessage: monitoringResults.errorMessage,
        responseTime: monitoringResults.responseTime,
        status: monitoringResults.status,
        timestamp: monitoringResults.timestamp,
      })
      .from(monitoringResults)
      .where(eq(monitoringResults.serviceId, id))
      .orderBy(desc(monitoringResults.timestamp))
      .limit(limit)
  );
  const [first, ...rest] = queries;
  const results = await db.batch([first, ...rest]);
  return new Map(serviceIds.map((id, i) => [id, results[i]]));
}

export async function getServicesWithStatus(
  db = getDb()
): Promise<ServiceWithStatus[]> {
  const since = new Date(Date.now() - DAY_MS).toISOString();

  const [allServices, stats] = await Promise.all([
    db.select().from(services),
    db
      .select({
        serviceId: monitoringResults.serviceId,
        total: count(),
        up: sql<number>`sum(${monitoringResults.status} = 'up')`,
      })
      .from(monitoringResults)
      .where(gte(monitoringResults.timestamp, since))
      // unary + stops SQLite from picking the (service_id, ...) index and
      // scanning every row; it then range-scans the timestamp index instead
      .groupBy(sql`+${monitoringResults.serviceId}`),
  ]);
  const recent = await getRecentChecks(
    db,
    allServices.map((s) => s.id),
    HISTORY_LENGTH
  );

  return allServices.map((service) => {
    const stat = stats.find((s) => s.serviceId === service.id);
    const checks = recent.get(service.id) ?? [];
    const [last] = checks;
    return {
      ...service,
      history: checks.toReversed(),
      lastCheck: last?.timestamp,
      responseTime: last?.responseTime ?? undefined,
      status: last?.status,
      uptime: stat ? (stat.up / stat.total) * 100 : undefined,
    };
  });
}

export async function saveService({ id, ...values }: ServiceInput) {
  const db = getDb();
  if (id === undefined) {
    const [created] = await db.insert(services).values(values).returning();
    return created;
  }
  const [updated] = await db
    .update(services)
    .set(values)
    .where(eq(services.id, id))
    .returning();
  return updated;
}

export async function deleteService(id: number) {
  const db = getDb();
  const [, , , [deleted]] = await db.batch([
    db.delete(monitoringResults).where(eq(monitoringResults.serviceId, id)),
    db.delete(incidents).where(eq(incidents.serviceId, id)),
    db.delete(serviceAlerts).where(eq(serviceAlerts.serviceId, id)),
    db.delete(services).where(eq(services.id, id)).returning(),
  ]);
  return deleted;
}

/** What visitors of the public status page may see */
export const toPublicService = (service: ServiceWithStatus) => ({
  history: service.history.map(({ errorMessage: _, ...check }) => check),
  id: service.id,
  link: service.showAddress
    ? `${service.type}://${service.address}${[80, 443].includes(service.port) ? "" : `:${service.port}`}`
    : null,
  name: service.name,
  status: service.status,
  uptime: service.uptime,
});

export type PublicService = ReturnType<typeof toPublicService>;
