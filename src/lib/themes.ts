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
  // Wide display type, hairline-ringed cards, pill bars
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
      "0 0 0 1px var(--line), 0 1px 2px color-mix(in srgb, #000 10%, transparent)",
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
    shadow: "2px 2px 0 var(--text)",
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
    "#0e0f12",
    "#16181c",
    "#262a30",
    "#e6e8ec",
    "#8b919b",
    "#8fa8d4",
    "#6fb592",
    "#cfa765",
    "#d27d72",
  ]),
  "pilotlight-light": theme("Pilotlight Light", "light", STYLES.pilotlight, [
    "#f6f7f8",
    "#ffffff",
    "#e2e5e9",
    "#17191d",
    "#5f6670",
    "#3d5f99",
    "#2f7553",
    "#8f6720",
    "#b04a40",
  ]),
  "prism-dark": theme("Prism Dark", "dark", STYLES.prism, [
    "#0a0a0a",
    "#121212",
    "#232323",
    "#ededed",
    "#8c8c8c",
    "#e6e6e6",
    "#7fb894",
    "#c9a96a",
    "#d08080",
  ]),
  "prism-light": theme("Prism Light", "light", STYLES.prism, [
    "#ffffff",
    "#f6f6f6",
    "#e6e6e6",
    "#0b0b0b",
    "#6a6a6a",
    "#111111",
    "#2f7550",
    "#8a6a26",
    "#a8483f",
  ]),
  "terminal-dark": theme("Terminal Dark", "dark", STYLES.terminal, [
    "#0b0d0c",
    "#121513",
    "#232a25",
    "#d6e2d9",
    "#7d8c81",
    "#86b8ac",
    "#74b38a",
    "#c9ad62",
    "#cf7b70",
  ]),
  "terminal-light": theme("Terminal Light", "light", STYLES.terminal, [
    "#f4f5f1",
    "#fbfbf9",
    "#d9ddd4",
    "#182019",
    "#59645b",
    "#2f6c62",
    "#2e7247",
    "#866a1e",
    "#a84a3e",
  ]),
  "blueprint-dark": theme("Blueprint Dark", "dark", STYLES.blueprint, [
    "#0b1424",
    "#111c30",
    "#24344f",
    "#e3e9f2",
    "#8b9ab2",
    "#8eb1d6",
    "#6fb39a",
    "#cdab6a",
    "#d27f78",
  ]),
  "blueprint-light": theme("Blueprint Light", "light", STYLES.blueprint, [
    "#eef2f7",
    "#f8fafc",
    "#c6d2e1",
    "#0f1d33",
    "#4f5f78",
    "#2e5a8a",
    "#2b6f55",
    "#876422",
    "#a94a42",
  ]),
  "signal-dark": theme("Signal Dark", "dark", STYLES.signal, [
    "#0f0e13",
    "#17151d",
    "#28252f",
    "#ebe8f0",
    "#948fa0",
    "#ab9fd0",
    "#74b39a",
    "#cdab6a",
    "#d2808a",
  ]),
  "signal-light": theme("Signal Light", "light", STYLES.signal, [
    "#f7f6f9",
    "#ffffff",
    "#e4e1ea",
    "#1c1924",
    "#615c6b",
    "#5b4b8f",
    "#2d6f55",
    "#876422",
    "#a8475a",
  ]),
  "graphite-dark": theme("Graphite Dark", "dark", STYLES.graphite, [
    "#121212",
    "#1a1a1a",
    "#2f2f2f",
    "#ededed",
    "#969696",
    "#d39a72",
    "#78b28c",
    "#ceab68",
    "#d27f74",
  ]),
  "graphite-light": theme("Graphite Light", "light", STYLES.graphite, [
    "#f2f1ee",
    "#fbfaf8",
    "#d6d3cd",
    "#161616",
    "#5e5b56",
    "#94552e",
    "#2e7048",
    "#85631f",
    "#a8483d",
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
    "item-radius": cards ? style.radius : "0px",
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
