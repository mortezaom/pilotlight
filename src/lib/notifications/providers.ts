import {
  formatDiscord,
  formatEmailHtml,
  formatPlainText,
  formatSlack,
  formatTitle,
} from "./formatter";
import type { NotificationCredentials, NotificationPayload } from "./types";

const USER_AGENT = "Pilotlight-Monitor/1.0";

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      ...headers,
    },
    method: "POST",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
}

const TRAILING_SLASHES = /\/+$/u;
const trimSlash = (url: string) => url.replace(TRAILING_SLASHES, "");

/** Sends a notification through the given provider, throws on failure */
export function deliver(
  payload: NotificationPayload,
  creds: NotificationCredentials
): Promise<void> {
  const good = payload.isRecovery || payload.status === "up";

  switch (creds.provider) {
    case "telegram":
      return postJson(
        `https://api.telegram.org/bot${creds.botToken}/sendMessage`,
        {
          chat_id: creds.chatId,
          text: formatPlainText(payload),
        }
      );
    case "discord":
      return postJson(creds.webhookUrl, {
        ...formatDiscord(payload),
        avatar_url: creds.avatarUrl || undefined,
        username: creds.username || undefined,
      });
    case "slack":
      return postJson(creds.webhookUrl, formatSlack(payload));
    case "email":
      return postJson(
        "https://api.resend.com/emails",
        {
          from: creds.fromEmail,
          html: formatEmailHtml(payload),
          subject: formatTitle(payload),
          text: formatPlainText(payload),
          to: creds.toEmails,
        },
        { Authorization: `Bearer ${creds.resendApiKey}` }
      );
    case "ntfy":
      // JSON publishing keeps non-ASCII titles intact (headers can't carry them)
      return postJson(
        trimSlash(creds.serverUrl),
        {
          message: formatPlainText(payload),
          priority: creds.priority ?? 3,
          tags: [good ? "white_check_mark" : "rotating_light"],
          title: formatTitle(payload),
          topic: creds.topic,
        },
        creds.token ? { Authorization: `Bearer ${creds.token}` } : {}
      );
    case "gotify":
      return postJson(
        `${trimSlash(creds.serverUrl)}/message`,
        {
          message: formatPlainText(payload),
          priority: creds.priority ?? 5,
          title: formatTitle(payload),
        },
        { "X-Gotify-Key": creds.appToken }
      );
    case "apprise":
      return postJson(creds.appriseUrl, {
        body: formatPlainText(payload),
        title: formatTitle(payload),
        type: good ? "success" : "failure",
      });
    default:
      throw new Error("Unsupported notification provider");
  }
}
