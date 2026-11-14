import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NotificationChannelDialog } from "@/components/dashboard/notification-channel-dialog";
import { NotificationChannelsList } from "@/components/dashboard/notification-channels-list";
import { Button } from "@/components/ui/button";
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

  const [deleting, setDeleting] = useState<PublicNotificationChannel | null>(
    null
  );

  const deleteChannel = async () => {
    if (!deleting) {
      return;
    }
    try {
      await apiFetch(`/api/notification-channels/${deleting.id}`, {
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
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sub max-w-xl">
          Telegram, Discord, Slack, email, ntfy, Gotify or Apprise. Choose which
          services alert each channel from the bell on the services page.
        </p>
        <Button onClick={() => openDialog(null)} size="sm">
          <PlusIcon /> new channel
        </Button>
      </div>
      <NotificationChannelsList
        channels={channels}
        loading={loading}
        onDelete={setDeleting}
        onEdit={openDialog}
        onToggle={handleToggle}
      />
      <NotificationChannelDialog
        channel={editing}
        onOpenChange={setDialogOpen}
        onSaved={() => {
          setDialogOpen(false);
          loadChannels();
        }}
        open={dialogOpen}
      />
      <ConfirmDialog
        confirmLabel="Delete"
        description={`Delete "${deleting?.name}"? Services that alert through it stop sending there.`}
        onClose={() => setDeleting(null)}
        onConfirm={deleting ? deleteChannel : null}
        title="Delete channel"
      />
    </section>
  );
}
