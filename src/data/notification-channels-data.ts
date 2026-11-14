import { z } from "zod/mini";

const HTTP_URL = /^https?:\/\//u;

const httpUrl = (message: string) =>
  z.string().check(z.refine((val) => HTTP_URL.test(val), message));

export const credentialsSchema = z.discriminatedUnion("provider", [
  z.object({
    botToken: z.string().check(z.minLength(1, "Bot token is required")),
    chatId: z.string().check(z.minLength(1, "Chat ID is required")),
    provider: z.literal("telegram"),
  }),
  z.object({
    avatarUrl: z.optional(z.string()),
    provider: z.literal("discord"),
    username: z.optional(z.string()),
    webhookUrl: z
      .string()
      .check(
        z.startsWith(
          "https://discord.com/api/webhooks/",
          "Must be a valid Discord webhook URL"
        )
      ),
  }),
  z.object({
    provider: z.literal("slack"),
    webhookUrl: z
      .string()
      .check(
        z.startsWith(
          "https://hooks.slack.com/",
          "Must be a valid Slack webhook URL"
        )
      ),
  }),
  z.object({
    fromEmail: z.email(),
    provider: z.literal("email"),
    resendApiKey: z
      .string()
      .check(z.startsWith("re_", "Must be a valid Resend API key (re_...)")),
    toEmails: z
      .array(z.email())
      .check(z.minLength(1, "At least one recipient is required")),
  }),
  z.object({
    priority: z.optional(z.number().check(z.gte(1), z.lte(5))),
    provider: z.literal("ntfy"),
    serverUrl: httpUrl("Must start with http or https"),
    token: z.optional(z.string()),
    topic: z.string().check(z.minLength(1, "Topic is required")),
  }),
  z.object({
    appToken: z.string().check(z.minLength(1, "App token is required")),
    priority: z.optional(z.number().check(z.gte(0), z.lte(10))),
    provider: z.literal("gotify"),
    serverUrl: httpUrl("Must start with http or https"),
  }),
  z.object({
    appriseUrl: httpUrl("Must start with http or https"),
    provider: z.literal("apprise"),
  }),
]);

export type NotificationCredentials = z.infer<typeof credentialsSchema>;
export type NotificationProvider = NotificationCredentials["provider"];

export const createChannelSchema = z.object({
  credentials: credentialsSchema,
  enabled: z.optional(z.boolean()),
  name: z.string().check(z.trim(), z.minLength(2), z.maxLength(50)),
});

export const updateChannelSchema = z.partial(createChannelSchema);

export const providerInfo: Record<
  NotificationProvider,
  { name: string; description: string; setupGuide: string }
> = {
  apprise: {
    description: "Universal notification gateway",
    name: "Apprise",
    setupGuide:
      "1. Set up an Apprise API server\n2. Configure your notification services\n3. Copy the API endpoint URL",
  },
  discord: {
    description: "Send notifications to Discord channels",
    name: "Discord",
    setupGuide:
      "1. Go to Server Settings → Integrations\n2. Create a webhook\n3. Copy the webhook URL",
  },
  email: {
    description: "Send email notifications via the Resend API",
    name: "Email",
    setupGuide:
      "1. Sign up at https://resend.com (free tier available)\n2. Verify your sending domain at https://resend.com/domains\n3. Create an API key at https://resend.com/api-keys\n4. Use an address on your verified domain as 'From'",
  },
  gotify: {
    description: "Self-hosted notification server",
    name: "Gotify",
    setupGuide:
      "1. Install a Gotify server\n2. Create an application\n3. Copy the app token",
  },
  ntfy: {
    description: "Simple HTTP-based pub-sub notifications",
    name: "ntfy",
    setupGuide:
      "1. Choose a topic name\n2. Subscribe to ntfy.sh/your-topic\n3. Optionally set up an auth token",
  },
  slack: {
    description: "Send notifications to Slack channels",
    name: "Slack",
    setupGuide:
      "1. Go to your Slack workspace\n2. Create an Incoming Webhook\n3. Copy the webhook URL",
  },
  telegram: {
    description: "Send notifications via Telegram Bot",
    name: "Telegram",
    setupGuide:
      "1. Create a bot via @BotFather\n2. Get your bot token\n3. Start a chat with your bot\n4. Get your chat ID from @userinfobot",
  },
};
