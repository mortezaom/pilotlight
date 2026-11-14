import { STATUS_LABELS } from "@/data/services-data";
import type { CheckStatus } from "@/lib/alert-rules";
import { cn } from "@/lib/utils";

const COLORS = {
  down: "text-down",
  error: "text-down",
  timeout: "text-warn",
  up: "text-up",
} as const;

export default function StatusBadge({ status }: { status?: CheckStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        status ? COLORS[status] : "text-sub"
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {status ? STATUS_LABELS[status].toLowerCase() : "no data"}
    </span>
  );
}
