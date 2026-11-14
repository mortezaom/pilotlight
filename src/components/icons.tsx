import { FlameIcon } from "lucide-react";

/** Pilotlight mark: the small always-on flame that shows a system is alive */
export const LogoVector = (props: { className?: string }) => (
  <FlameIcon aria-hidden className={props.className} color="var(--primary)" />
);
