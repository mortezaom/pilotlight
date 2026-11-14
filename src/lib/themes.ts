// Admin-selectable themes. A theme is a complete look: a palette (nine colors)
// plus a style (fonts, radius, borders, panels, spacing, history bars, hero).
// Everything is emitted as CSS variables, so the layout stays the same while
// each theme reshapes it. Each family ships a dark and a light variant.

export const THEME_TOKENS = [
  "bg", // page background
  "surface", // inputs, dialogs, cards
  "line", // dividers and borders
  "text", // main text
  "sub", // secondary text, empty history bars
  "main", // accent: links, buttons, focus
  "up", // operational
  "warn", // timeout, degraded
  "down", // down, errors, destructive actions
] as const;

export type ThemeColors = Record<(typeof THEME_TOKENS)[number], string>;

const SANS = "system-ui, sans-serif";
const MONO = "ui-monospace, monospace";

// Google Fonts family, weight axis, and fallback stack
const GOOGLE_FONTS = {
  "funnel-display": ["Funnel Display", "300..800", SANS],
  geist: ["Geist", "100..900", SANS],
  "geist-mono": ["Geist Mono", "100..900", MONO],
  "google-sans-code": ["Google Sans Code", "300..800", MONO],
  "google-sans-flex": ["Google Sans Flex", "100..1000", SANS],
  "inter-tight": ["Inter Tight", "100..900", SANS],
  "jetbrains-mono": ["JetBrains Mono", "100..800", MONO],
  "martian-mono": ["Martian Mono", "100..800", MONO],
  onest: ["Onest", "100..900", SANS],
  outfit: ["Outfit", "100..900", SANS],
  "space-grotesk": ["Space Grotesk", "300..700", SANS],
  "space-mono": ["Space Mono", "400;700", MONO],
  unbounded: ["Unbounded", "200..900", SANS],
} as const;
type FontId = keyof typeof GOOGLE_FONTS;

/** CSS font stacks, e.g. '"Outfit", system-ui, sans-serif' */
export const FONTS = Object.fromEntries(
  Object.entries(GOOGLE_FONTS).map(([id, [family, , fallback]]) => [
    id,
    `"${family}", ${fallback}`,
  ])
) as Record<FontId, string>;

/** Google Fonts stylesheet URL for the given fonts (every font when omitted) */
export function fontsHref(ids = Object.keys(GOOGLE_FONTS) as FontId[]) {
  const families = [...new Set(ids)].map((id) => {
    const [family, weights] = GOOGLE_FONTS[id];
    return `family=${family.replaceAll(" ", "+")}:wght@${weights}`;
  });
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

export type ThemeStyle = {
  label: string; // shown in the picker, e.g. "terminal"
  fonts: { body: FontId; heading: FontId; data: FontId };
  heading: {
    weight: number;
    case: "none" | "uppercase" | "lowercase";
    tracking: string;
  };
  radius: string;
  density: number; // spacing multiplier
  // service list: separated rows, or individual cards
  items: "rows" | "cards";
  border: string; // card / box border, e.g. "1px solid", "2px solid", "0px solid"
  shadow: string; // card shadow; may use theme colors via var()
  bars: { height: string; up: string; gap: string; radius: string };
  hero: {
    size: string; // headline font size
    align: "left" | "center";
    // full-width band: raised surface, accent tint, or ink (darkest / inverted)
    fill: "surface" | "tint" | "ink";
  };
};

export type Theme = {
  name: string;
  mode: "dark" | "light";
  colors: ThemeColors;
  style: ThemeStyle;
};

const STYLES = {
  // Default: friendly geometric sans, soft cards, blue-flame accent
  pilotlight: {
    bars: { gap: "2px", height: "24px", radius: "3px", up: "55%" },
    border: "1px solid",
    density: 1.05,
    fonts: {
      body: "google-sans-flex",
      data: "google-sans-code",
      heading: "google-sans-flex",
    },
    heading: { case: "none", tracking: "-0.03em", weight: 600 },
    hero: {
      align: "center",
      fill: "surface",
      size: "clamp(2.4rem, 7vw, 4rem)",
    },
    items: "cards",
    label: "pilotlight",
    radius: "14px",
    shadow: "none",
  },
  // Monochrome, light display type, ink hero with white strands
  prism: {
    bars: { gap: "3px", height: "20px", radius: "999px", up: "45%" },
    border: "1px solid",
    density: 1.15,
    fonts: { body: "geist", data: "geist-mono", heading: "outfit" },
    heading: { case: "none", tracking: "-0.035em", weight: 400 },
    hero: {
      align: "center",
      fill: "ink",
      size: "clamp(2.6rem, 8vw, 4.6rem)",
    },
    items: "rows",
    label: "prism",
    radius: "10px",
    shadow: "none",
  },
  // One monospace face, lowercase, square blocks
  terminal: {
    bars: { gap: "1px", height: "18px", radius: "0px", up: "50%" },
    border: "1px solid",
    density: 0.95,
    fonts: {
      body: "jetbrains-mono",
      data: "jetbrains-mono",
      heading: "jetbrains-mono",
    },
    heading: { case: "lowercase", tracking: "-0.02em", weight: 700 },
    hero: {
      align: "left",
      fill: "tint",
      size: "clamp(2rem, 6vw, 3.2rem)",
    },
    items: "rows",
    label: "terminal",
    radius: "0px",
    shadow: "none",
  },
  // Technical drawing: grotesk caps, hard 2px rules, no rounding
  blueprint: {
    bars: { gap: "2px", height: "28px", radius: "0px", up: "50%" },
    border: "2px solid",
    density: 1,
    fonts: {
      body: "space-grotesk",
      data: "space-mono",
      heading: "space-grotesk",
    },
    heading: { case: "uppercase", tracking: "-0.01em", weight: 700 },
    hero: {
      align: "left",
      fill: "surface",
      size: "clamp(2.4rem, 8vw, 4.4rem)",
    },
    items: "cards",
    label: "blueprint",
    radius: "0px",
    shadow: "none",
  },
  // Wide display type, glowing borderless cards, pill bars
  signal: {
    bars: { gap: "3px", height: "26px", radius: "999px", up: "55%" },
    border: "0px solid",
    density: 1.15,
    fonts: { body: "onest", data: "martian-mono", heading: "unbounded" },
    heading: { case: "none", tracking: "-0.02em", weight: 600 },
    hero: {
      align: "center",
      fill: "tint",
      size: "clamp(2rem, 6vw, 3.4rem)",
    },
    items: "cards",
    label: "signal",
    radius: "18px",
    shadow:
      "0 0 0 1px var(--line), 0 12px 32px -12px color-mix(in srgb, var(--main) 35%, transparent)",
  },
  // Heavy display headline, thick outlines, offset shadows, inverted hero
  graphite: {
    bars: { gap: "2px", height: "30px", radius: "2px", up: "55%" },
    border: "2px solid",
    density: 1.05,
    fonts: {
      body: "inter-tight",
      data: "jetbrains-mono",
      heading: "funnel-display",
    },
    heading: { case: "none", tracking: "-0.04em", weight: 800 },
    hero: {
      align: "left",
      fill: "ink",
      size: "clamp(2.8rem, 9vw, 5.2rem)",
    },
    items: "cards",
    label: "graphite",
    radius: "4px",
    shadow: "4px 4px 0 var(--text)",
  },
} satisfies Record<string, ThemeStyle>;

const theme = (
  name: string,
  mode: Theme["mode"],
  style: ThemeStyle,
  [bg, surface, line, text, sub, main, up, warn, down]: string[]
): Theme => ({
  colors: { bg, down, line, main, sub, surface, text, up, warn },
  mode,
  name,
  style,
});

// Palette order: bg, surface, line, text, sub, main, up, warn, down
export const THEMES = {
  "pilotlight-dark": theme("Pilotlight Dark", "dark", STYLES.pilotlight, [
    "#0c0d10",
    "#15171c",
    "#262a31",
    "#eceef2",
    "#8d94a0",
    "#6ea8ff",
    "#3fd39a",
    "#f5b74f",
    "#ff6b6b",
  ]),
  "pilotlight-light": theme("Pilotlight Light", "light", STYLES.pilotlight, [
    "#f5f6f8",
    "#ffffff",
    "#e1e4e9",
    "#14161a",
    "#5d6470",
    "#2160e0",
    "#15803d",
    "#b45309",
    "#dc2626",
  ]),
  "prism-dark": theme("Prism Dark", "dark", STYLES.prism, [
    "#0a0a0a",
    "#121213",
    "#242426",
    "#f5f5f5",
    "#8e8e93",
    "#ffffff",
    "#4ade80",
    "#fbbf24",
    "#f87171",
  ]),
  "prism-light": theme("Prism Light", "light", STYLES.prism, [
    "#ffffff",
    "#f6f6f7",
    "#e5e5e8",
    "#0a0a0a",
    "#6b6b70",
    "#0a0a0a",
    "#16a34a",
    "#b45309",
    "#dc2626",
  ]),
  "terminal-dark": theme("Terminal Dark", "dark", STYLES.terminal, [
    "#0a0d0b",
    "#111612",
    "#223026",
    "#d5f2dc",
    "#7f9a86",
    "#56d4c8",
    "#4ade80",
    "#facc15",
    "#ff6b6b",
  ]),
  "terminal-light": theme("Terminal Light", "light", STYLES.terminal, [
    "#f3f5ef",
    "#fafbf7",
    "#d6ddd0",
    "#15241a",
    "#56655a",
    "#0f766e",
    "#15803d",
    "#a16207",
    "#b91c1c",
  ]),
  "blueprint-dark": theme("Blueprint Dark", "dark", STYLES.blueprint, [
    "#081326",
    "#0d1c36",
    "#22406b",
    "#e6f0ff",
    "#8ba5cb",
    "#5cc8ff",
    "#4ade9a",
    "#ffc35c",
    "#ff7a7a",
  ]),
  "blueprint-light": theme("Blueprint Light", "light", STYLES.blueprint, [
    "#edf3fb",
    "#f8fbff",
    "#b9cde8",
    "#0b1f3a",
    "#4a6283",
    "#0b5fc0",
    "#137a4a",
    "#9a5800",
    "#c0302b",
  ]),
  "signal-dark": theme("Signal Dark", "dark", STYLES.signal, [
    "#0d0b14",
    "#17131f",
    "#2a2438",
    "#efeaff",
    "#9a91b3",
    "#a78bfa",
    "#34d399",
    "#fbbf24",
    "#fb7185",
  ]),
  "signal-light": theme("Signal Light", "light", STYLES.signal, [
    "#f7f5fc",
    "#ffffff",
    "#e4def3",
    "#1b1530",
    "#625a7a",
    "#6d28d9",
    "#047857",
    "#b45309",
    "#be123c",
  ]),
  "graphite-dark": theme("Graphite Dark", "dark", STYLES.graphite, [
    "#121212",
    "#1b1b1b",
    "#333333",
    "#f2f2f2",
    "#9a9a9a",
    "#ff7a33",
    "#3ddc84",
    "#ffc247",
    "#ff5c5c",
  ]),
  "graphite-light": theme("Graphite Light", "light", STYLES.graphite, [
    "#f2f1ee",
    "#fbfaf8",
    "#d7d4cd",
    "#151515",
    "#5f5c57",
    "#c94600",
    "#187a3f",
    "#955f00",
    "#c42b2b",
  ]),
} satisfies Record<string, Theme>;

export type ThemeId = keyof typeof THEMES;

export const DEFAULT_THEMES = {
  dark: "pilotlight-dark",
  light: "pilotlight-light",
} as const satisfies Record<Theme["mode"], ThemeId>;

export const isThemeId = (id: string): id is ThemeId => id in THEMES;

/** Hero band background and text color for each fill */
function heroColors(fill: ThemeStyle["hero"]["fill"], mode: Theme["mode"]) {
  if (fill === "ink") {
    // darker than the page in dark mode, inverted in light mode
    return mode === "dark"
      ? ["color-mix(in srgb, var(--bg) 40%, #000)", "var(--text)"]
      : ["var(--text)", "var(--bg)"];
  }
  if (fill === "tint") {
    return ["color-mix(in srgb, var(--main) 9%, var(--bg))", "var(--text)"];
  }
  return ["var(--surface)", "var(--text)"];
}

/** Every CSS variable a theme sets; styles.css only ever reads these */
export function themeVars({
  colors,
  mode,
  style,
}: Theme): Record<string, string> {
  const cards = style.items === "cards";
  const [heroBg, heroFg] = heroColors(style.hero.fill, mode);
  return {
    ...colors,
    "bar-gap": style.bars.gap,
    "bar-height": style.bars.height,
    "bar-radius": style.bars.radius,
    "bar-up": style.bars.up,
    edge: style.border,
    density: String(style.density),
    "font-body": FONTS[style.fonts.body],
    "font-data": FONTS[style.fonts.data],
    "font-heading": FONTS[style.fonts.heading],
    "heading-case": style.heading.case,
    "heading-tracking": style.heading.tracking,
    "heading-weight": String(style.heading.weight),
    "hero-align": style.hero.align,
    "hero-items": style.hero.align === "center" ? "center" : "flex-start",
    "hero-bg": heroBg,
    "hero-fg": heroFg,
    "hero-size": style.hero.size,
    // status colors are tuned for the page, so lift them on an inverted hero
    "hero-lift": style.hero.fill === "ink" && mode === "light" ? "40%" : "0%",
    "item-bg": cards ? "var(--surface)" : "transparent",
    "item-border": cards ? "var(--edge) var(--line)" : "0px solid transparent",
    "item-divider": "var(--edge) var(--line)",
    "item-gap": cards ? "0.75rem" : "0px",
    "item-pad": cards ? "1.1rem 1.25rem" : "1rem 0",
    "item-shadow": cards ? style.shadow : "none",
    radius: style.radius,
    "color-scheme": mode,
  };
}

const declarations = (t: Theme) =>
  Object.entries(themeVars(t))
    .map(([name, value]) =>
      name === "color-scheme" ? `color-scheme:${value}` : `--${name}:${value}`
    )
    .join(";");

const pair = (darkId: string, lightId: string) => ({
  dark: THEMES[isThemeId(darkId) ? darkId : DEFAULT_THEMES.dark],
  light: THEMES[isThemeId(lightId) ? lightId : DEFAULT_THEMES.light],
});

/** CSS for the chosen pair: light by default, dark when the visitor's OS prefers it */
export function themeCss(darkId: string, lightId: string) {
  const { dark, light } = pair(darkId, lightId);
  // html:root outranks the :root fallback in styles.css whatever the load order
  return `html:root{${declarations(light)}}@media (prefers-color-scheme:dark){html:root{${declarations(dark)}}}`;
}

/** Google Fonts URL with only the fonts the chosen pair uses */
export function themeFontsHref(darkId: string, lightId: string) {
  const { dark, light } = pair(darkId, lightId);
  return fontsHref(
    [dark, light].flatMap(({ style }) => Object.values(style.fonts))
  );
}
