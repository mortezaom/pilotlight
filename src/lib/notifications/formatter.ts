import type { NotificationPayload } from "./types";

const isGood = (p: NotificationPayload) => p.isRecovery || p.status === "up";

export const statusText = (p: NotificationPayload) =>
  p.isRecovery ? "RECOVERED" : p.status.toUpperCase();

export const formatTitle = (p: NotificationPayload) =>
  `${isGood(p) ? "✅" : "🚨"} ${p.serviceName} - ${statusText(p)}`;

const details = (p: NotificationPayload) =>
  [
    ["Status", statusText(p)],
    ["Time", new Date(p.timestamp).toUTCString()],
    ["Response Time", p.responseTime ? `${p.responseTime}ms` : undefined],
    ["Status Code", p.statusCode ? String(p.statusCode) : undefined],
  ].filter((entry): entry is [string, string] => entry[1] !== undefined);

export function formatPlainText(p: NotificationPayload): string {
  const lines = details(p).map(([label, value]) => `${label}: ${value}`);
  return `${formatTitle(p)}\n\n${lines.join("\n")}\n\n${p.message}`;
}

export function formatDiscord(p: NotificationPayload) {
  let color = 0x2e_cc_71;
  if (!isGood(p)) {
    color = p.status === "down" ? 0xe7_4c_3c : 0xe6_7e_22;
  }
  return {
    embeds: [
      {
        color,
        description: p.message,
        fields: details(p).map(([name, value]) => ({
          inline: true,
          name,
          value,
        })),
        footer: { text: "Pilotlight Monitoring" },
        timestamp: p.timestamp,
        title: formatTitle(p),
      },
    ],
  };
}

export function formatSlack(p: NotificationPayload) {
  return {
    blocks: [
      {
        text: { emoji: true, text: formatTitle(p), type: "plain_text" },
        type: "header",
      },
      {
        fields: details(p).map(([label, value]) => ({
          text: `*${label}:*\n${value}`,
          type: "mrkdwn",
        })),
        type: "section",
      },
      { text: { text: p.message, type: "plain_text" }, type: "section" },
    ],
    text: formatPlainText(p),
  };
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function formatEmailHtml(p: NotificationPayload): string {
  let color = "#2ecc71";
  if (!isGood(p)) {
    color = p.status === "down" ? "#e74c3c" : "#e67e22";
  }
  const rows = details(p)
    .map(
      ([label, value]) =>
        `<p style="margin:8px 0"><b>${label}:</b> ${escapeHtml(value)}</p>`
    )
    .join("");

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#333">
<div style="max-width:600px;margin:0 auto;padding:20px">
<div style="background:${color};color:#fff;padding:20px;border-radius:8px 8px 0 0"><h2 style="margin:0">${escapeHtml(p.serviceName)}</h2><p style="margin:4px 0 0">${statusText(p)}</p></div>
<div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px">${rows}<p>${escapeHtml(p.message)}</p></div>
<p style="text-align:center;color:#999;font-size:12px">Pilotlight Monitoring</p>
</div></body></html>`;
}
