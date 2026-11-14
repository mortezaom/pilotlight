const utc = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
});

/** "14 Nov, 14:05 UTC" */
export const formatUtc = (iso: string) => `${utc.format(new Date(iso))} UTC`;

/** "3 min", "2 h", "4 days" */
export function formatAge(fromIso: string, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - Date.parse(fromIso)) / 60_000));
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours} h` : `${Math.round(hours / 24)} days`;
}
