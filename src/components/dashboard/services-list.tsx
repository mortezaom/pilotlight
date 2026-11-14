import { formatDistanceToNowStrict } from "date-fns";
import { BellIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ServiceAlertsDialog } from "@/components/dashboard/service-alerts-dialog";
import { ServiceDeleteDialog } from "@/components/dashboard/service-delete-dialog";
import { ServiceDialog } from "@/components/dashboard/service-dialog";
import StatusBadge from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import type { ServiceWithStatus } from "@/data/services-storage";
import { apiFetch, errorMessage } from "@/lib/api-client";

export function ServicesList() {
  const [services, setServices] = useState<ServiceWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  // undefined = closed, null = creating a new service
  const [editing, setEditing] = useState<ServiceWithStatus | null>();
  const [deleting, setDeleting] = useState<ServiceWithStatus | null>(null);
  const [alerting, setAlerting] = useState<ServiceWithStatus | null>(null);

  useEffect(() => {
    apiFetch<ServiceWithStatus[]>("/api/services")
      .then(setServices)
      .catch((error) => toast.error(errorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const onSaved = (saved: ServiceWithStatus) => {
    setServices((prev) =>
      prev.some((s) => s.id === saved.id)
        ? prev.map((s) => (s.id === saved.id ? saved : s))
        : [...prev, saved]
    );
    setEditing(undefined);
  };

  const onDeleted = (deleted: ServiceWithStatus) => {
    setServices((prev) => prev.filter((s) => s.id !== deleted.id));
    setDeleting(null);
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sub">
          {loading ? "loading…" : `${services.length} monitored`}
        </p>
        <Button onClick={() => setEditing(null)} size="sm">
          <PlusIcon /> new service
        </Button>
      </div>
      <ul className="border-line flex flex-col border-t">
        {services.map((service) => (
          <li
            className="border-line grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b py-3 sm:grid-cols-[minmax(0,1fr)_7rem_5rem_9rem_auto]"
            key={service.id}
          >
            <div className="min-w-0">
              <p className="truncate">
                {service.name}
                {!service.public && (
                  <span className="text-sub ml-2 text-xs">hidden</span>
                )}
              </p>
              <p className="text-sub truncate text-xs">
                {service.type}://{service.address}:{service.port}
              </p>
            </div>
            <StatusBadge status={service.status} />
            <span className="text-sub hidden sm:block">
              {service.uptime === undefined
                ? "—"
                : `${service.uptime.toFixed(1)}%`}
            </span>
            <span className="text-sub hidden whitespace-nowrap sm:block">
              {service.lastCheck
                ? formatDistanceToNowStrict(new Date(service.lastCheck), {
                    addSuffix: true,
                  })
                : "never"}
            </span>
            <div className="col-span-2 flex justify-end gap-1 sm:col-span-1">
              <Button
                aria-label={`Alerts for ${service.name}`}
                onClick={() => setAlerting(service)}
                size="icon"
                variant="ghost"
              >
                <BellIcon />
              </Button>
              <Button
                aria-label={`Edit ${service.name}`}
                onClick={() => setEditing(service)}
                size="icon"
                variant="ghost"
              >
                <PencilIcon />
              </Button>
              <Button
                aria-label={`Delete ${service.name}`}
                className="hover:text-down"
                onClick={() => setDeleting(service)}
                size="icon"
                variant="ghost"
              >
                <Trash2Icon />
              </Button>
            </div>
          </li>
        ))}
        {!loading && services.length === 0 && (
          <li className="text-sub py-6">
            No services yet. Add the first one to start monitoring.
          </li>
        )}
      </ul>
      {editing !== undefined && (
        <ServiceDialog
          onOpenChange={(open) => !open && setEditing(undefined)}
          onSaved={onSaved}
          service={editing}
        />
      )}
      <ServiceAlertsDialog
        onOpenChange={(open) => !open && setAlerting(null)}
        service={alerting}
      />
      <ServiceDeleteDialog
        onDeleted={onDeleted}
        onOpenChange={(open) => !open && setDeleting(null)}
        service={deleting}
      />
    </section>
  );
}
