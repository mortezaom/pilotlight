import { describe, expect, test } from "bun:test";
import {
  type AlertRule,
  INTERVAL_SLACK_MS,
  isDue,
  leadingFailures,
  rulesToNotify,
} from "../src/lib/alert-rules";
import { overallStatus } from "../src/lib/status";

const rule = (overrides: Partial<AlertRule> = {}): AlertRule => ({
  alertThreshold: 3,
  channelId: "c1",
  notifyOnRecovery: true,
  serviceId: 1,
  ...overrides,
});

describe("isDue", () => {
  const now = Date.parse("2026-11-14T12:00:00Z");
  const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

  test("never checked", () => expect(isDue(undefined, 5, now)).toBe(true));
  test("interval elapsed", () =>
    expect(isDue(minutesAgo(5), 5, now)).toBe(true));
  test("within slack still due", () =>
    expect(
      isDue(
        new Date(now - 5 * 60_000 + INTERVAL_SLACK_MS).toISOString(),
        5,
        now
      )
    ).toBe(true));
  test("too recent", () => expect(isDue(minutesAgo(2), 5, now)).toBe(false));
});

describe("leadingFailures", () => {
  test("counts failures before the newest up", () =>
    expect(leadingFailures(["down", "timeout", "up", "down"])).toBe(2));
  test("all failing", () => expect(leadingFailures(["error", "down"])).toBe(2));
  test("currently up", () => expect(leadingFailures(["up", "down"])).toBe(0));
  test("no history", () => expect(leadingFailures([])).toBe(0));
});

describe("rulesToNotify", () => {
  const rules = [rule(), rule({ channelId: "c2", notifyOnRecovery: false })];

  test("alerts exactly when the threshold is reached", () => {
    expect(rulesToNotify(1, "down", 1, rules)).toHaveLength(0);
    expect(rulesToNotify(1, "down", 2, rules)).toHaveLength(2);
  });
  test("does not repeat while still failing", () =>
    expect(rulesToNotify(1, "down", 3, rules)).toHaveLength(0));
  test("recovery only after an alert, only where enabled", () => {
    expect(rulesToNotify(1, "up", 2, rules)).toHaveLength(0);
    expect(rulesToNotify(1, "up", 3, rules).map((r) => r.channelId)).toEqual([
      "c1",
    ]);
  });
  test("ignores other services", () =>
    expect(rulesToNotify(2, "down", 2, rules)).toHaveLength(0));
  test("threshold of 1 alerts on the first failure", () =>
    expect(
      rulesToNotify(1, "error", 0, [rule({ alertThreshold: 1 })])
    ).toHaveLength(1));
});

describe("overallStatus", () => {
  test("levels", () => {
    expect(overallStatus([]).level).toBe("unknown");
    expect(overallStatus([undefined]).level).toBe("unknown");
    expect(overallStatus(["up", "up"]).level).toBe("up");
    expect(overallStatus(["up", "down"])).toMatchObject({
      label: "Partial outage",
      level: "partial",
    });
    expect(overallStatus(["timeout", "error"]).level).toBe("down");
  });
});
