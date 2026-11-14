// Pure scheduling/alerting rules (no Cloudflare imports) so they can be unit tested

export type CheckStatus = "up" | "down" | "timeout" | "error";

export type AlertRule = {
  serviceId: number;
  channelId: string;
  alertThreshold: number; // consecutive failures
  notifyOnRecovery: boolean;
};

// cron and check duration jitter, so a 5 min interval doesn't skip every other run
export const INTERVAL_SLACK_MS = 30_000;

/** Whether a service is due, given its newest stored check time (ISO) */
export const isDue = (
  lastCheck: string | undefined,
  intervalMinutes: number,
  now: number
) =>
  !lastCheck ||
  now - Date.parse(lastCheck) >= intervalMinutes * 60_000 - INTERVAL_SLACK_MS;

/** Consecutive failures at the start of a newest-first status list */
export const leadingFailures = (statuses: CheckStatus[]) => {
  const index = statuses.indexOf("up");
  return index === -1 ? statuses.length : index;
};

/**
 * Rules to notify for one check: once when consecutive failures reach the
 * threshold, and once on recovery after an alert was sent.
 */
export function rulesToNotify(
  serviceId: number,
  status: CheckStatus,
  previousFailures: number,
  rules: AlertRule[]
) {
  const isFailure = status !== "up";
  const failures = isFailure ? previousFailures + 1 : 0;
  return rules.filter(
    (rule) =>
      rule.serviceId === serviceId &&
      (isFailure
        ? failures === rule.alertThreshold
        : rule.notifyOnRecovery && previousFailures >= rule.alertThreshold)
  );
}
