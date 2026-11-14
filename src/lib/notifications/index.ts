import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notificationChannels, serviceAlerts } from "@/db/schema";
import { type AlertRule, rulesToNotify } from "../alert-rules";
import { decrypt, encrypt } from "../encryption";
import { deliver } from "./providers";
import type {
  NotificationChannel,
  NotificationCredentials,
  NotificationPayload,
  PublicNotificationChannel,
} from "./types";

export const encryptCredentials = (credentials: NotificationCredentials) =>
  encrypt(JSON.stringify(credentials));

const decryptCredentials = async (channel: NotificationChannel) =>
  JSON.parse(await decrypt(channel.credentials)) as NotificationCredentials;

/**
 * Hides credentials; flags channels whose credentials can't be decrypted
 * (e.g. after ENCRYPTION_KEY changed) so the UI can ask to re-enter them.
 */
export async function toPublicChannel(
  channel: NotificationChannel
): Promise<PublicNotificationChannel> {
  const credentialsReadable = await decryptCredentials(channel)
    .then(() => true)
    .catch(() => false);
  const { credentials: _, ...rest } = channel;
  return { ...rest, credentialsReadable };
}

export function sendTestNotification(credentials: NotificationCredentials) {
  return deliver(
    {
      message: `Your ${credentials.provider} notification channel is configured correctly!`,
      serviceName: "Pilotlight",
      status: "up",
      timestamp: new Date().toISOString(),
    },
    credentials
  );
}

export const getAllChannels = (db = getDb()) =>
  db.select().from(notificationChannels) as Promise<NotificationChannel[]>;

export async function getChannel(channelId: string, db = getDb()) {
  const [channel] = await db
    .select()
    .from(notificationChannels)
    .where(eq(notificationChannels.id, channelId));
  return (channel as NotificationChannel | undefined) ?? null;
}

export async function saveChannel(channel: NotificationChannel, db = getDb()) {
  await db
    .insert(notificationChannels)
    .values(channel)
    .onConflictDoUpdate({ set: channel, target: notificationChannels.id });
}

export async function deleteChannel(channelId: string, db = getDb()) {
  await db.batch([
    db.delete(serviceAlerts).where(eq(serviceAlerts.channelId, channelId)),
    db
      .delete(notificationChannels)
      .where(eq(notificationChannels.id, channelId)),
  ]);
}

export const getServiceMappings = (serviceId: number, db = getDb()) =>
  db.select().from(serviceAlerts).where(eq(serviceAlerts.serviceId, serviceId));

export async function saveServiceMappings(
  serviceId: number,
  mappings: AlertRule[],
  db = getDb()
) {
  const clear = db
    .delete(serviceAlerts)
    .where(eq(serviceAlerts.serviceId, serviceId));
  await (mappings.length > 0
    ? db.batch([clear, db.insert(serviceAlerts).values(mappings)])
    : clear);
}

export type AlertEvent = {
  service: { id: number; name: string };
  check: Pick<
    NotificationPayload,
    "status" | "message" | "responseTime" | "statusCode"
  >;
  previousFailures: number; // consecutive failed checks before this one
};

/** Delivers due alerts for a monitoring run; failures are logged, not thrown */
export async function sendAlerts(
  events: AlertEvent[],
  rules: AlertRule[],
  db = getDb()
) {
  const due = events.flatMap((event) =>
    rulesToNotify(
      event.service.id,
      event.check.status,
      event.previousFailures,
      rules
    ).map((rule) => ({ event, rule }))
  );
  if (due.length === 0) {
    return;
  }

  const channels = await getAllChannels(db);
  const outcomes = await Promise.allSettled(
    due.map(async ({ event, rule }) => {
      const channel = channels.find((ch) => ch.id === rule.channelId);
      if (!channel?.enabled) {
        return;
      }
      try {
        await deliver(
          {
            ...event.check,
            isRecovery: event.check.status === "up",
            serviceName: event.service.name,
            timestamp: new Date().toISOString(),
          },
          await decryptCredentials(channel)
        );
      } catch (error) {
        throw new Error(`Alert to channel "${channel.name}" failed`, {
          cause: error,
        });
      }
    })
  );
  for (const outcome of outcomes) {
    if (outcome.status === "rejected") {
      console.error(outcome.reason);
    }
  }
}
