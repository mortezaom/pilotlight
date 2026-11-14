import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { NotificationChannelDialog } from "@/components/dashboard/notification-channel-dialog";
import { NotificationChannelsList } from "@/components/dashboard/notification-channels-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch, errorMessage } from "@/lib/api-client";
import type { PublicNotificationChannel } from "@/lib/notifications/types";

export function NotificationsManager() {
  const [channels, setChannels] = useState<PublicNotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PublicNotificationChannel | null>(
    null
  );

  const loadChannels = useCallback(async () => {
    try {
      setChannels(
        await apiFetch<PublicNotificationChannel[]>(
          "/api/notification-channels"
        )
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const openDialog = (channel: PublicNotificationChannel | null) => {
    setEditing(channel);
    setDialogOpen(true);
  };

  const handleDelete = async (channelId: string) => {
    // biome-ignore lint/suspicious/noAlert: simple confirmation is enough here
    const confirmed = confirm("Delete this notification channel?");
    if (!confirmed) {
      return;
    }
    try {
      await apiFetch(`/api/notification-channels/${channelId}`, {
        method: "DELETE",
      });
      toast.success("Channel deleted");
      await loadChannels();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleToggle = async (channelId: string, enabled: boolean) => {
    try {
      await apiFetch(`/api/notification-channels/${channelId}`, {
        json: { enabled },
        method: "PATCH",
      });
      toast.success(enabled ? "Channel enabled" : "Channel disabled");
      await loadChannels();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Manage notification channels and alert settings
          </p>
        </div>
        <Button onClick={() => openDialog(null)} size="lg">
          <Plus className="mr-2 size-4" />
          Add Channel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Configure where you want to receive alerts when your services go
            down. Supports Telegram, Discord, Slack, Email, ntfy, Gotify, and
            Apprise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationChannelsList
            channels={channels}
            loading={loading}
            onDelete={handleDelete}
            onEdit={openDialog}
            onToggle={handleToggle}
          />
        </CardContent>
      </Card>

      <NotificationChannelDialog
        channel={editing}
        onOpenChange={setDialogOpen}
        onSaved={() => {
          setDialogOpen(false);
          loadChannels();
        }}
        open={dialogOpen}
      />
    </div>
  );
}
