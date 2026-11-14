import { and, eq, lt } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { getRecentChecks } from "@/data/services-storage";
import { getDb } from "@/db";
import {
  incidents,
  monitoringResults,
  type Service,
  type ServiceStatus,
  serviceAlerts,
  services,
} from "@/db/schema";
import { isDue, leadingFailures } from "./alert-rules";
import { sendAlerts } from "./notifications";
import { getSetting } from "./settings";

const CHECK_TIMEOUT_MS = 30_000;
const RETENTION_DAYS = 90;
// enough history to count consecutive failures for any alert threshold
const FAILURE_LOOKBACK = 20;
const STANDARD_PORTS: Record<string, number> = { http: 80, https: 443 };
const USER_AGENT = "Pilotlight-Monitor/1.0";

export const CLEANUP_CRON = "0 3 * * *";

type CheckResult = {
  status: ServiceStatus;
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
};

// workerd reports DNS/connection failures as an opaque "internal error"
const describeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.startsWith("internal error")
    ? "Connection failed (DNS lookup or network error)"
    : message;
};

const failure = (error: unknown): CheckResult =>
  error instanceof DOMException && error.name === "TimeoutError"
    ? {
        errorMessage: `No response within ${CHECK_TIMEOUT_MS / 1000}s`,
        status: "timeout",
      }
    : { errorMessage: describeError(error), status: "error" };

async function checkHttp(service: Service): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(`${service.type}://${service.address}`, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "manual",
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    await response.body?.cancel();
    const up = response.status < 400;
    return {
      errorMessage: up ? undefined : `HTTP ${response.status}`,
      responseTime: Date.now() - start,
      status: up ? "up" : "down",
      statusCode: response.status,
    };
  } catch (error) {
    return failure(error);
  }
}

async function checkTcp(
  service: Service,
  checkerUrl: string
): Promise<CheckResult> {
  if (!checkerUrl) {
    return {
      errorMessage: "TCP checker URL is not configured in Settings",
      status: "error",
    };
  }
  const start = Date.now();
  try {
    const response = await fetch(checkerUrl, {
      body: JSON.stringify({
        host: service.address,
        port: service.port,
        timeout: CHECK_TIMEOUT_MS,
      }),
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      method: "POST",
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS + 5000),
    });
    if (!response.ok) {
      throw new Error(`TCP checker returned HTTP ${response.status}`);
    }
    // relay-tcp contract: { available, duration (ms), error }
    const result = (await response.json()) as {
      available: boolean;
      duration?: number;
      error?: string;
    };
    return {
      errorMessage: result.error || undefined,
      responseTime: Math.round(result.duration ?? Date.now() - start),
      status: result.available ? "up" : "down",
    };
  } catch (error) {
    return failure(error);
  }
}

// Workers' fetch ignores non-standard ports in production, so those go through the TCP checker
export const checkService = (service: Service, tcpCheckerUrl: string) =>
  service.type === "tcp" || STANDARD_PORTS[service.type] !== service.port
    ? checkTcp(service, tcpCheckerUrl)
    : checkHttp(service);

/**
 * Checks every service whose interval has elapsed, then records results,
 * incidents and alerts. Free plan: 50 subrequests (fetch, KV and D1 calls)
 * per run, so reads happen once up front and all writes go in one batch:
 * about 6 calls + one fetch per due service (+ alert deliveries).
 */
export async function runMonitoring(now = Date.now()) {
  const db = getDb();
  const [allServices, settings, ongoing, rules] = await Promise.all([
    db.select().from(services),
    getSetting("settings", db),
    db
      .select({ id: incidents.id, serviceId: incidents.serviceId })
      .from(incidents)
      .where(eq(incidents.status, "ongoing")),
    db.select().from(serviceAlerts),
  ]);
  const recent = await getRecentChecks(
    db,
    allServices.map((s) => s.id),
    FAILURE_LOOKBACK
  );

  const { defaultMonitoringInterval, tcpCheckerUrl } = settings ?? {
    defaultMonitoringInterval: 5,
    tcpCheckerUrl: "",
  };
  const due = allServices.filter((service) =>
    isDue(
      recent.get(service.id)?.[0]?.timestamp,
      defaultMonitoringInterval,
      now
    )
  );
  if (due.length === 0) {
    return 0;
  }

  const checks = await Promise.all(
    due.map(async (service) => {
      // the start time, so a slow/timed-out check doesn't push the next one back
      const timestamp = new Date().toISOString();
      return {
        result: await checkService(service, tcpCheckerUrl),
        service,
        timestamp,
      };
    })
  );

  const writes = checks.flatMap(({ service, result, timestamp }) => {
    const statements: BatchItem<"sqlite">[] = [
      db.insert(monitoringResults).values({
        errorMessage: result.errorMessage ?? null,
        responseTime: result.responseTime ?? null,
        serviceId: service.id,
        status: result.status,
        statusCode: result.statusCode ?? null,
        timestamp,
      }),
    ];
    const incident = ongoing.find((i) => i.serviceId === service.id);
    if (result.status === "up" && incident) {
      statements.push(
        db
          .update(incidents)
          .set({ endTime: timestamp, status: "resolved" })
          .where(eq(incidents.id, incident.id))
      );
    } else if (result.status !== "up" && !incident) {
      statements.push(
        db.insert(incidents).values({
          description: result.errorMessage ?? null,
          serviceId: service.id,
          startTime: timestamp,
          status: "ongoing",
          title: `${service.name} is ${result.status}`,
        })
      );
    }
    return statements;
  });
  const [first, ...rest] = writes;
  await db.batch([first, ...rest]);

  await sendAlerts(
    checks.map(({ service, result }) => ({
      check: {
        message: result.errorMessage ?? `${service.name} is ${result.status}`,
        responseTime: result.responseTime,
        status: result.status,
        statusCode: result.statusCode,
      },
      previousFailures: leadingFailures(
        (recent.get(service.id) ?? []).map((c) => c.status)
      ),
      service,
    })),
    rules,
    db
  );
  return due.length;
}

/** Drops results and resolved incidents older than the retention period */
export async function cleanupOldData() {
  const db = getDb();
  const cutoff = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  await db.batch([
    db.delete(monitoringResults).where(lt(monitoringResults.timestamp, cutoff)),
    db
      .delete(incidents)
      .where(
        and(eq(incidents.status, "resolved"), lt(incidents.endTime, cutoff))
      ),
  ]);
}
