import type { CheckStatus } from "./alert-rules";

type Overall = {
  level: "up" | "partial" | "down" | "unknown";
  label: string; // headline, e.g. "Partial outage"
  detail: string; // e.g. "1 of 3 services affected"
};

/** The status page headline, from the latest status of each visible service */
export function overallStatus(statuses: (CheckStatus | undefined)[]): Overall {
  const known = statuses.filter((s) => s !== undefined);
  const failing = known.filter((s) => s !== "up").length;
  if (known.length === 0) {
    return {
      detail: "No checks have run yet",
      label: "Waiting for data",
      level: "unknown",
    };
  }
  const plural = known.length === 1 ? "service" : "services";
  if (failing === 0) {
    return {
      detail: `All ${known.length} ${plural} responding`,
      label: "All systems operational",
      level: "up",
    };
  }
  return {
    detail: `${failing} of ${known.length} ${plural} affected`,
    label: failing === known.length ? "Major outage" : "Partial outage",
    level: failing === known.length ? "down" : "partial",
  };
}
