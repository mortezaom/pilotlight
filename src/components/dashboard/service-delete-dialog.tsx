import { Loader2Icon } from "lucide-react";
import { useState } from "react";
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
import type { ServiceWithStatus } from "@/data/services-storage";
import { apiFetch, errorMessage } from "@/lib/api-client";

export function ServiceDeleteDialog({
  service,
  onOpenChange,
  onDeleted,
}: {
  service: ServiceWithStatus | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (service: ServiceWithStatus) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!service) {
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/api/services/${service.id}`, { method: "DELETE" });
      toast.success("Service deleted");
      onDeleted(service);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={!!service}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Service</DialogTitle>
          <DialogDescription>
            Delete {service?.name} and all of its monitoring history? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={handleDelete}
            variant="destructive"
          >
            {loading ? <Loader2Icon className="animate-spin" /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
