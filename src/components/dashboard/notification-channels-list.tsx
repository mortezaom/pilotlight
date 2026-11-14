import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { providerInfo } from "@/data/notification-channels-data";
import type { PublicNotificationChannel } from "@/lib/notifications/types";

export function NotificationChannelsList({
  channels,
  loading,
  onEdit,
  onDelete,
  onToggle,
}: {
  channels: PublicNotificationChannel[];
  loading: boolean;
  onEdit: (channel: PublicNotificationChannel) => void;
  onDelete: (channel: PublicNotificationChannel) => void;
  onToggle: (channelId: string, enabled: boolean) => void;
}) {
  return (
    <ul className="border-line flex flex-col border-t">
      {channels.map((channel) => (
        <li
          className="border-line grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b py-3"
          key={channel.id}
        >
          <div className="min-w-0">
            <p className="truncate">{channel.name}</p>
            <p className="text-sub text-xs">
              {providerInfo[channel.provider].name.toLowerCase()}
              {channel.enabled ? "" : " · paused"}
            </p>
            {!channel.credentialsReadable && (
              <p className="text-down text-xs">
                Can't decrypt the saved credentials (the encryption key
                changed). Edit the channel and enter them again.
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Switch
              aria-label={`${channel.enabled ? "Pause" : "Resume"} ${channel.name}`}
              checked={channel.enabled}
              className="mr-2"
              onCheckedChange={(checked) => onToggle(channel.id, checked)}
            />
            <Button
              aria-label={`Edit ${channel.name}`}
              onClick={() => onEdit(channel)}
              size="icon"
              variant="ghost"
            >
              <PencilIcon />
            </Button>
            <Button
              aria-label={`Delete ${channel.name}`}
              className="hover:text-down"
              onClick={() => onDelete(channel)}
              size="icon"
              variant="ghost"
            >
              <Trash2Icon />
            </Button>
          </div>
        </li>
      ))}
      {!loading && channels.length === 0 && (
        <li className="text-sub py-6">
          No channels yet. Add one to get alerts when a service goes down.
        </li>
      )}
    </ul>
  );
}
