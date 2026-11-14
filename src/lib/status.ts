import type { CheckStatus } from "./alert-rules";

type Overall = { level: "up" | "partial" | "down" | "unknown"; label: string };

/** The status page banner, from the latest status of each visible service */
export function overallStatus(statuses: (CheckStatus | undefined)[]): Overall {
  const known = statuses.filter((s) => s !== undefined);
  const failing = known.filter((s) => s !== "up").length;
  if (known.length === 0) {
    return { label: "Waiting for the first checks", level: "unknown" };
  }
  if (failing === 0) {
    return { label: "All systems operational", level: "up" };
  }
  if (failing === known.length) {
    return { label: "Major outage", level: "down" };
  }
  return {
    label: `Partial outage (${failing} of ${known.length} services affected)`,
    level: "partial",
  };
}
