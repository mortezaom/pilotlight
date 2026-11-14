import type { CheckStatus } from "./alert-rules";

type Overall = {
  level: "up" | "partial" | "down" | "unknown";
  label: string; // headline, e.g. "Partial outage"
};

/** The status page headline, from the latest status of each visible service */
export function overallStatus(statuses: (CheckStatus | undefined)[]): Overall {
  const known = statuses.filter((s) => s !== undefined);
  const failing = known.filter((s) => s !== "up").length;
  if (known.length === 0) {
    return {
      label: "Waiting for data",
      level: "unknown",
    };
  }
  if (failing === 0) {
    return {
      label: "All systems operational",
      level: "up",
    };
  }
  return {
    label: failing === known.length ? "Major outage" : "Partial outage",
    level: failing === known.length ? "down" : "partial",
  };
}
