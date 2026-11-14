import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { DEFAULT_THEMES } from "./themes";

export type GlobalSettings = {
  defaultMonitoringInterval: number; // minutes
  tcpCheckerUrl: string;
  darkTheme: string; // theme ids from src/lib/themes.ts
  lightTheme: string;
};

export type Branding = {
  title: string;
  description: string;
  announcement: string; // optional banner text shown above the live status
  imageUrl: string | null; // logo as a data URI
};

export type Admin = {
  email: string;
  password: string; // hashPassword() output
  sessionVersion: number; // bumped on logout to revoke every session
};

type Documents = { admin: Admin; branding: Branding; settings: GlobalSettings };

const DEFAULTS: { [K in keyof Documents]?: Documents[K] } = {
  branding: {
    announcement: "",
    description: "Uptime monitoring and status page",
    imageUrl: null,
    title: "Pilotlight",
  },
  settings: {
    darkTheme: DEFAULT_THEMES.dark,
    defaultMonitoringInterval: 5,
    lightTheme: DEFAULT_THEMES.light,
    tcpCheckerUrl: "",
  },
};

export async function getSetting<K extends keyof Documents>(
  key: K,
  db = getDb()
): Promise<Documents[K] | null> {
  const row = await db.query.settings.findFirst({
    where: (s, { eq }) => eq(s.key, key),
  });
  const stored = row?.value as Partial<Documents[K]> | undefined;
  const fallback = DEFAULTS[key];
  if (!fallback) {
    return (stored as Documents[K]) ?? null;
  }
  return { ...fallback, ...stored };
}

export async function putSetting<K extends keyof Documents>(
  key: K,
  value: Documents[K],
  db = getDb()
) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ set: { value }, target: settings.key });
}
