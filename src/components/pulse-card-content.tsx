/** biome-ignore-all lint/suspicious/noArrayIndexKey: bars have no identity */
/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: hover tooltip */
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { STATUS_LABELS } from "@/data/services-data";
import type { CheckPoint, PublicService } from "@/data/services-storage";
import { cn } from "@/lib/utils";

const BARS = 50;

const BAR_COLORS = {
  down: "bg-red-500",
  error: "bg-amber-500",
  timeout: "bg-amber-500",
  up: "bg-emerald-500",
} as const;

// errorMessage is only present for the signed-in admin
type Bar = Omit<CheckPoint, "errorMessage"> & { errorMessage?: string | null };

const describe = (check: Bar) =>
  [
    new Date(check.timestamp).toLocaleString(),
    check.status.toUpperCase(),
    check.responseTime === null ? null : `${check.responseTime}ms`,
    check.errorMessage,
  ]
    .filter(Boolean)
    .join(" · ");

const fade = {
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -3 },
  initial: { opacity: 0, y: 3 },
  transition: { duration: 0.15 },
};

export const PulseCardContent = ({
  history,
  status,
  uptime,
  showStatus = true,
}: Pick<PublicService, "status" | "uptime"> & {
  history: Bar[];
  showStatus?: boolean;
}) => {
  const [message, setMessage] = useState<string>();
  const closeTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = (msg?: string) => {
    clearTimeout(closeTimeout.current);
    setMessage(msg);
  };
  const hide = () => {
    closeTimeout.current = setTimeout(() => setMessage(undefined), 150);
  };

  // pad on the left so the newest check is always the last bar
  const bars: (Bar | null)[] = [
    ...Array.from({ length: BARS - history.length }, () => null),
    ...history.slice(-BARS),
  ];
  const half = BARS / 2;

  return (
    <CardContent className="relative">
      <div className="flex h-16 flex-col items-stretch gap-0.5 sm:h-8 sm:flex-row">
        {[bars.slice(0, half), bars.slice(half)].map((row, r) => (
          <ul className="flex h-8 w-full items-stretch gap-0.5" key={r}>
            {row.map((item, i) => (
              <li
                className={cn(
                  "w-full cursor-pointer rounded-sm transition-opacity hover:opacity-80",
                  item ? BAR_COLORS[item.status] : "bg-muted-foreground/15"
                )}
                key={i}
                onMouseEnter={() => show(item ? describe(item) : "No data")}
                onMouseLeave={hide}
              />
            ))}
          </ul>
        ))}
      </div>
      <div className="text-muted-foreground mt-2 flex min-h-[1.5em] items-center justify-between text-xs font-bold">
        <AnimatePresence initial={false} mode="wait">
          {message ? (
            <motion.div
              className="text-primary flex w-full items-center justify-between"
              key="message"
              {...fade}
            >
              <span>{message}</span>
            </motion.div>
          ) : (
            <motion.div
              className="flex w-full items-center justify-between"
              key="default"
              {...fade}
            >
              <span>
                {showStatus && (status ? STATUS_LABELS[status] : "Unknown")}
              </span>
              <span>
                Uptime {uptime === undefined ? "N/A" : `${uptime.toFixed(1)}%`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CardContent>
  );
};
