import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, errorMessage } from "@/lib/api-client";
import { THEME_TOKENS, THEMES, type Theme, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

const entries = Object.entries(THEMES) as [ThemeId, Theme][];

/** Shows the theme on this page right away when it matches the OS mode */
function preview(theme: Theme) {
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if ((theme.mode === "dark") !== dark) {
    return;
  }
  for (const token of THEME_TOKENS) {
    document.documentElement.style.setProperty(
      `--${token}`,
      theme.colors[token]
    );
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-2">
        {entries
          .filter(([, theme]) => theme.mode === mode)
          .map(([id, { colors, name }]) => (
            <button
              aria-pressed={id === value}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left outline-offset-2",
                id === value && "outline-main outline-2"
              )}
              key={id}
              onClick={() => onChange(id)}
              style={{
                background: colors.bg,
                borderColor: colors.line,
                color: colors.text,
              }}
              type="button"
            >
              <span className="truncate">{name.toLowerCase()}</span>
              <span aria-hidden="true" className="flex shrink-0 gap-1">
                {[colors.main, colors.up, colors.warn, colors.down].map((c) => (
                  <span
                    className="size-2.5 rounded-full"
                    key={c}
                    style={{ background: c }}
                  />
                ))}
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
