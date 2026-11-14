import { formatDistanceToNow } from "date-fns";
import {
  BellIcon,
  FileEditIcon,
  PlusCircleIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ServiceAlertsDialog } from "@/components/dashboard/service-alerts-dialog";
import { ServiceDeleteDialog } from "@/components/dashboard/service-delete-dialog";
import { ServiceDialog } from "@/components/dashboard/service-dialog";
import ServerBadge from "@/components/server-badge";
import StatusBadge from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ServiceWithStatus } from "@/data/services-storage";
import { apiFetch, errorMessage } from "@/lib/api-client";

const COLUMNS = [
  "#",
  "Name",
  "Type",
  "Address",
  "Port",
  "Status",
  "Uptime (24h)",
  "Response Time",
  "Last Check",
  "Actions",
];

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
    <Card className="w-full">
      <CardHeader>
        <CardAction>
          <Button onClick={() => setEditing(null)} size="sm">
            <PlusCircleIcon /> New Service
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column, i) => (
                <TableHead
                  className={i > 1 ? "text-center" : undefined}
                  key={column}
                >
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.id}</TableCell>
                <TableCell>{service.name}</TableCell>
                <TableCell className="text-center">
                  <ServerBadge>{service.type}</ServerBadge>
                </TableCell>
                <TableCell className="text-center">{service.address}</TableCell>
                <TableCell className="text-center">{service.port}</TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={service.status} />
                </TableCell>
                <TableCell className="text-center">
                  {service.uptime === undefined
                    ? "N/A"
                    : `${service.uptime.toFixed(1)}%`}
                </TableCell>
                <TableCell className="text-center">
                  {service.responseTime === undefined
                    ? "N/A"
                    : `${service.responseTime}ms`}
                </TableCell>
                <TableCell className="text-center">
                  {service.lastCheck
                    ? formatDistanceToNow(new Date(service.lastCheck), {
                        addSuffix: true,
                      })
                    : "Never"}
                </TableCell>
                <TableCell className="flex items-center justify-center gap-2">
                  <Button
                    aria-label={`Alerts for ${service.name}`}
                    className="size-8"
                    onClick={() => setAlerting(service)}
                    size="icon"
                    variant="ghost"
                  >
                    <BellIcon />
                  </Button>
                  <Button
                    aria-label={`Edit ${service.name}`}
                    className="size-8"
                    onClick={() => setEditing(service)}
                    size="icon"
                    variant="ghost"
                  >
                    <FileEditIcon />
                  </Button>
                  <Button
                    aria-label={`Delete ${service.name}`}
                    className="size-8"
                    onClick={() => setDeleting(service)}
                    size="icon"
                    variant="destructive"
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!loading && services.length === 0 && (
              <TableRow>
                <TableCell
                  className="text-muted-foreground py-6 text-center font-semibold"
                  colSpan={COLUMNS.length}
                >
                  No services found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
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
    </Card>
  );
}
