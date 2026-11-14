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
import { Switch } from "@/components/ui/switch";
import { providerInfo } from "@/data/notification-channels-data";
import type { ServiceWithStatus } from "@/data/services-storage";
import { apiFetch, errorMessage } from "@/lib/api-client";
import type {
  PublicNotificationChannel,
  ServiceNotificationMapping,
} from "@/lib/notifications/types";

export function ServiceAlertsDialog({
  service,
  onOpenChange,
}: {
  service: ServiceWithStatus | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [channels, setChannels] = useState<PublicNotificationChannel[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [threshold, setThreshold] = useState(3);
  const [notifyOnRecovery, setNotifyOnRecovery] = useState(true);
  const [busy, setBusy] = useState<"loading" | "saving" | null>("loading");

  useEffect(() => {
    if (!service) {
      return;
    }
    setBusy("loading");
    Promise.all([
      apiFetch<PublicNotificationChannel[]>("/api/notification-channels"),
      apiFetch<ServiceNotificationMapping[]>(
        `/api/services/${service.id}/notifications`
      ),
    ])
      .then(([allChannels, mappings]) => {
        setChannels(allChannels);
        setSelected(new Set(mappings.map((m) => m.channelId)));
        if (mappings[0]) {
          setThreshold(mappings[0].alertThreshold);
          setNotifyOnRecovery(mappings[0].notifyOnRecovery);
        }
      })
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setBusy(null));
  }, [service]);

  const toggle = (channelId: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) {
        next.add(channelId);
      } else {
        next.delete(channelId);
      }
      return next;
    });

  const handleSave = async () => {
    if (!service) {
      return;
    }
    setBusy("saving");
    try {
      await apiFetch(`/api/services/${service.id}/notifications`, {
        json: {
          alertThreshold: threshold,
          channelIds: [...selected],
          notifyOnRecovery,
        },
        method: "PUT",
      });
      toast.success("Alert settings saved");
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={!!service}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alerts for {service?.name}</DialogTitle>
          <DialogDescription>
            Choose which channels are notified when this service goes down.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-3">
            {channels.length === 0 && busy !== "loading" && (
              <p className="text-muted-foreground text-sm">
                No notification channels yet. Add one on the Notifications page.
              </p>
            )}
            {channels.map((channel) => (
              <div
                className="flex items-center justify-between gap-4"
                key={channel.id}
              >
                <Label htmlFor={`alert-${channel.id}`}>
                  {channel.name}
                  <span className="text-muted-foreground text-xs">
                    {providerInfo[channel.provider].name}
                    {channel.enabled ? "" : " (disabled)"}
                  </span>
                </Label>
                <Switch
                  checked={selected.has(channel.id)}
                  id={`alert-${channel.id}`}
                  onCheckedChange={(on) => toggle(channel.id, on)}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-threshold">
              Alert after consecutive failed checks
            </Label>
            <Input
              id="alert-threshold"
              max={20}
              min={1}
              onChange={(e) => setThreshold(e.target.valueAsNumber)}
              type="number"
              value={Number.isNaN(threshold) ? "" : threshold}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="alert-recovery">Notify when it recovers</Label>
            <Switch
              checked={notifyOnRecovery}
              id="alert-recovery"
              onCheckedChange={setNotifyOnRecovery}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button disabled={busy !== null} onClick={handleSave}>
            {busy === "saving" ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
