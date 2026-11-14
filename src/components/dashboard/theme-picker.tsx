import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, errorMessage } from "@/lib/api-client";
import {
  FONTS,
  THEMES,
  type Theme,
  type ThemeId,
  themeVars,
} from "@/lib/themes";
import { cn } from "@/lib/utils";

// "\"Funnel Display Variable\", system-ui" -> "Funnel Display"
const fontName = (id: keyof typeof FONTS) =>
  FONTS[id].split('"')[1].replace(" Variable", "");

const entries = Object.entries(THEMES) as [ThemeId, Theme][];

const SAMPLE = [
  "up",
  "up",
  "up",
  "up",
  "up",
  "down",
  "up",
  "up",
  "warn",
  "up",
  "up",
  "up",
] as const;

/** Shows the theme on this page right away when it matches the OS mode */
function preview(theme: Theme) {
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if ((theme.mode === "dark") !== dark) {
    return;
  }
  for (const [name, value] of Object.entries(themeVars(theme))) {
    if (name !== "color-scheme") {
      document.documentElement.style.setProperty(`--${name}`, value);
    }
  }
}

function ThemeGroup({
  mode,
  value,
  onChange,
}: {
  mode: Theme["mode"];
  value: ThemeId;
  onChange: (id: ThemeId) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sub mb-2">
        {mode === "dark"
          ? "dark theme · for visitors in dark mode"
          : "light theme · for visitors in light mode"}
      </legend>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
        {entries
          .filter(([, theme]) => theme.mode === mode)
          .map(([id, { colors, name, style }]) => (
            // Each swatch is drawn in its own theme: colors, font and corners
            <button
              aria-pressed={id === value}
              className={cn(
                "flex flex-col gap-3 border p-3 text-left outline-offset-2",
                id === value && "outline-main outline-2"
              )}
              key={id}
              onClick={() => onChange(id)}
              style={{
                background: colors.bg,
                borderColor: colors.line,
                borderRadius: style.radius,
                color: colors.text,
              }}
              type="button"
            >
              <span
                className="text-lg leading-none"
                style={{
                  fontFamily: FONTS[style.fonts.heading],
                  fontWeight: style.heading.weight,
                  letterSpacing: style.heading.tracking,
                  textTransform: style.heading.case,
                }}
              >
                {name}
              </span>
              <span
                aria-hidden="true"
                className="flex h-3 items-end"
                style={{ gap: style.bars.gap }}
              >
                {SAMPLE.map((status, i) => (
                  <span
                    className="flex-1"
                    // biome-ignore lint/suspicious/noArrayIndexKey: static sample
                    key={i}
                    style={{
                      background: colors[status],
                      borderRadius: style.bars.radius,
                      height: status === "up" ? style.bars.up : "100%",
                    }}
                  />
                ))}
              </span>
              <span
                className="text-xs"
                style={{
                  color: colors.sub,
                  fontFamily: FONTS[style.fonts.data],
                }}
              >
                {fontName(style.fonts.heading)} · {fontName(style.fonts.data)}
              </span>
            </button>
          ))}
      </div>
    </fieldset>
  );
}

export function ThemePicker(props: {
  darkTheme: ThemeId;
  lightTheme: ThemeId;
}) {
  const [darkTheme, setDarkTheme] = useState(props.darkTheme);
  const [lightTheme, setLightTheme] = useState(props.lightTheme);
  const [saving, setSaving] = useState(false);

  const pick = (mode: Theme["mode"]) => (id: ThemeId) => {
    (mode === "dark" ? setDarkTheme : setLightTheme)(id);
    preview(THEMES[id]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/settings", {
        json: { darkTheme, lightTheme },
        method: "POST",
      });
      toast.success("Theme saved. The status page updates within a minute.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ThemeGroup mode="dark" onChange={pick("dark")} value={darkTheme} />
      <ThemeGroup mode="light" onChange={pick("light")} value={lightTheme} />
      <div>
        <Button disabled={saving} onClick={save}>
          {saving ? "saving…" : "save theme"}
        </Button>
      </div>
    </div>
  );
}
