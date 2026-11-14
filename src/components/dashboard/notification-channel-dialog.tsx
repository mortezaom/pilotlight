import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { providerInfo } from "@/data/notification-channels-data";
import { apiFetch, errorMessage } from "@/lib/api-client";
import type {
  NotificationProvider,
  PublicNotificationChannel,
} from "@/lib/notifications/types";

type Field = {
  key: string;
  label: string;
  placeholder: string;
  type?: "password" | "number" | "email" | "list";
};

const FIELDS: Record<NotificationProvider, Field[]> = {
  apprise: [
    {
      key: "appriseUrl",
      label: "Apprise API URL",
      placeholder: "https://apprise.example.com/notify",
    },
  ],
  discord: [
    {
      key: "webhookUrl",
      label: "Webhook URL",
      placeholder: "https://discord.com/api/webhooks/...",
    },
    {
      key: "username",
      label: "Username (optional)",
      placeholder: "Pilotlight",
    },
    {
      key: "avatarUrl",
      label: "Avatar URL (optional)",
      placeholder: "https://...",
    },
  ],
  email: [
    {
      key: "resendApiKey",
      label: "Resend API Key",
      placeholder: "re_xxxxxxxxxxxx",
      type: "password",
    },
    {
      key: "fromEmail",
      label: "From Email (verified domain)",
      placeholder: "alerts@yourdomain.com",
      type: "email",
    },
    {
      key: "toEmails",
      label: "To Emails (comma-separated)",
      placeholder: "user1@example.com, user2@example.com",
      type: "list",
    },
  ],
  gotify: [
    {
      key: "serverUrl",
      label: "Server URL",
      placeholder: "https://gotify.example.com",
    },
    {
      key: "appToken",
      label: "App Token",
      placeholder: "A...",
      type: "password",
    },
    {
      key: "priority",
      label: "Priority (0-10, default: 5)",
      placeholder: "5",
      type: "number",
    },
  ],
  ntfy: [
    { key: "serverUrl", label: "Server URL", placeholder: "https://ntfy.sh" },
    { key: "topic", label: "Topic", placeholder: "my-topic-name" },
    {
      key: "token",
      label: "Auth Token (optional)",
      placeholder: "tk_...",
      type: "password",
    },
    {
      key: "priority",
      label: "Priority (1-5, default: 3)",
      placeholder: "3",
      type: "number",
    },
  ],
  slack: [
    {
      key: "webhookUrl",
      label: "Webhook URL",
      placeholder: "https://hooks.slack.com/services/...",
    },
  ],
  telegram: [
    {
      key: "botToken",
      label: "Bot Token",
      placeholder: "1234567890:ABCdef...",
      type: "password",
    },
    { key: "chatId", label: "Chat ID", placeholder: "123456789" },
  ],
};

type Values = Record<string, string>;

/** Turns raw form strings into the credentials object the API validates */
function toCredentials(provider: NotificationProvider, values: Values) {
  const credentials: Record<string, unknown> = { provider };
  for (const field of FIELDS[provider]) {
    const value = values[field.key]?.trim();
    if (!value) {
      continue;
    }
    if (field.type === "number") {
      credentials[field.key] = Number(value);
    } else if (field.type === "list") {
      credentials[field.key] = value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    } else {
      credentials[field.key] = value;
    }
  }
  return credentials;
}

export function NotificationChannelDialog({
  open,
  onOpenChange,
  channel,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: PublicNotificationChannel | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<NotificationProvider>("telegram");
  const [enabled, setEnabled] = useState(true);
  const [values, setValues] = useState<Values>({});
  const [busy, setBusy] = useState<"testing" | "saving" | null>(null);

  // Stored credentials are never sent back, so editing starts with empty fields
  useEffect(() => {
    if (open) {
      setName(channel?.name ?? "");
      setProvider(channel?.provider ?? "telegram");
      setEnabled(channel?.enabled ?? true);
      setValues({});
    }
  }, [open, channel]);

  const credentialsChanged = Object.values(values).some((v) => v.trim());
  const credentials = toCredentials(provider, values);

  const handleTest = async () => {
    setBusy("testing");
    try {
      await apiFetch("/api/notification-channels/test", {
        json: { credentials },
        method: "POST",
      });
      toast.success("Test notification sent successfully!");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async () => {
    setBusy("saving");
    try {
      await apiFetch(
        channel
          ? `/api/notification-channels/${channel.id}`
          : "/api/notification-channels",
        {
          json: {
            // when editing, keep stored credentials unless new ones were typed
            credentials:
              !channel || credentialsChanged ? credentials : undefined,
            enabled,
            name,
          },
          method: channel ? "PATCH" : "POST",
        }
      );
      toast.success(channel ? "Channel updated" : "Channel created");
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const saveLabel = channel ? "Update" : "Create";

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {channel ? "Edit" : "Add"} Notification Channel
          </DialogTitle>
          <DialogDescription>
            Configure a notification channel to receive alerts when services go
            down.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel Name</Label>
            <Input
              id="channel-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Alerts"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-provider">Provider</Label>
            <Select
              disabled={!!channel}
              onValueChange={(p: NotificationProvider) => {
                setProvider(p);
                setValues({});
              }}
              value={provider}
            >
              <SelectTrigger id="channel-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(providerInfo) as NotificationProvider[]).map(
                  (p) => (
                    <SelectItem key={p} value={p}>
                      {providerInfo[p].name}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {providerInfo[provider].description}
            </p>
          </div>

          <div className="space-y-4">
            {channel && (
              <p className="text-muted-foreground text-xs">
                Leave the fields below empty to keep the saved credentials.
              </p>
            )}
            {FIELDS[provider].map((field) => (
              <div className="space-y-2" key={field.key}>
                <Label htmlFor={`cred-${field.key}`}>{field.label}</Label>
                <Input
                  id={`cred-${field.key}`}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  type={field.type === "list" ? "text" : (field.type ?? "text")}
                  value={values[field.key] ?? ""}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="channel-enabled">Enabled</Label>
              <p className="text-muted-foreground text-sm">
                Receive notifications through this channel
              </p>
            </div>
            <Switch
              checked={enabled}
              id="channel-enabled"
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="bg-muted space-y-2 rounded-lg p-4">
            <p className="text-sm font-semibold">Setup Guide</p>
            <pre className="text-xs whitespace-pre-wrap">
              {providerInfo[provider].setupGuide}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={busy !== null || (!!channel && !credentialsChanged)}
            onClick={handleTest}
            variant="outline"
          >
            {busy === "testing" ? "Testing..." : "Test"}
          </Button>
          <Button disabled={busy !== null} onClick={handleSave}>
            {busy === "saving" ? "Saving..." : saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
