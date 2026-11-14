// Admin-selectable themes. A theme is a complete look: a palette (nine colors)
// plus a style (fonts, radius, borders, panels, spacing, history bars, hero).
// Everything is emitted as CSS variables, so the layout stays the same while
// each theme reshapes it. Add one by adding an entry to THEMES.

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

// Font stacks; each is loaded in styles.css but only downloaded when used
export const FONTS = {
  archivo: '"Archivo Variable", "Arial Narrow", system-ui, sans-serif',
  bricolage: '"Bricolage Grotesque Variable", system-ui, sans-serif',
  fraunces: '"Fraunces Variable", Georgia, serif',
  geist: '"Geist Variable", system-ui, sans-serif',
  "geist-mono": '"Geist Mono Variable", ui-monospace, monospace',
  "ibm-plex-mono": '"IBM Plex Mono", ui-monospace, monospace',
  "ibm-plex-sans": '"IBM Plex Sans Variable", system-ui, sans-serif',
  "jetbrains-mono": '"JetBrains Mono Variable", ui-monospace, monospace',
  manrope: '"Manrope Variable", system-ui, sans-serif',
  vt323: '"VT323", ui-monospace, monospace',
} as const;
type FontId = keyof typeof FONTS;

export type ThemeStyle = {
  label: string; // shown in the picker, e.g. "editorial"
  fonts: { body: FontId; heading: FontId; data: FontId };
  heading: {
    weight: number;
    case: "none" | "uppercase" | "lowercase";
    tracking: string;
    stretch: string; // font-stretch, e.g. "75%" for condensed display faces
  };
  radius: string;
  density: number; // spacing multiplier
  // service list: separated rows, or individual cards
  items: "rows" | "cards";
  border: string; // card / box border, e.g. "1px solid", "2px solid", "1px dashed", "0px solid"
  shadow: string; // card shadow; may use theme colors via var()
  bars: { height: string; up: string; gap: string; radius: string };
  hero: {
    size: string; // headline font size
    align: "left" | "center";
    fill: "none" | "surface" | "tint" | "solid"; // hero background
  };
};

export type Theme = {
  name: string;
  mode: "dark" | "light";
  colors: ThemeColors;
  style: ThemeStyle;
};

const STYLES = {
  // Monkeytype-like: one monospace face, rows, square-ish blocks
  instrument: {
    bars: { gap: "1px", height: "20px", radius: "1px", up: "50%" },
    border: "1px solid",
    density: 1,
    fonts: {
      body: "jetbrains-mono",
      data: "jetbrains-mono",
      heading: "jetbrains-mono",
    },
    heading: {
      case: "lowercase",
      stretch: "100%",
      tracking: "-0.01em",
      weight: 600,
    },
    hero: { align: "left", fill: "none", size: "clamp(2rem, 6vw, 3rem)" },
    items: "rows",
    label: "instrument",
    radius: "3px",
    shadow: "none",
  },
  // Rounded, airy cards with pill bars
  soft: {
    bars: { gap: "3px", height: "26px", radius: "999px", up: "60%" },
    border: "0px solid",
    density: 1.15,
    fonts: { body: "geist", data: "geist-mono", heading: "geist" },
    heading: {
      case: "none",
      stretch: "100%",
      tracking: "-0.035em",
      weight: 650,
    },
    hero: {
      align: "center",
      fill: "surface",
      size: "clamp(2.2rem, 6vw, 3.4rem)",
    },
    items: "cards",
    label: "soft",
    radius: "16px",
    shadow: "none",
  },
  // Condensed uppercase display, hard rules, no rounding
  swiss: {
    bars: { gap: "1px", height: "34px", radius: "0px", up: "55%" },
    border: "2px solid",
    density: 1,
    fonts: { body: "ibm-plex-sans", data: "ibm-plex-mono", heading: "archivo" },
    heading: {
      case: "uppercase",
      stretch: "62%",
      tracking: "-0.01em",
      weight: 800,
    },
    hero: { align: "left", fill: "none", size: "clamp(3rem, 11vw, 6rem)" },
    items: "rows",
    label: "swiss",
    radius: "0px",
    shadow: "none",
  },
  // Pixel headings, dashed boxes, terminal feel
  retro: {
    bars: { gap: "2px", height: "18px", radius: "0px", up: "45%" },
    border: "1px dashed",
    density: 0.95,
    fonts: { body: "ibm-plex-mono", data: "vt323", heading: "vt323" },
    heading: {
      case: "uppercase",
      stretch: "100%",
      tracking: "0.03em",
      weight: 400,
    },
    hero: { align: "left", fill: "surface", size: "clamp(3rem, 10vw, 5rem)" },
    items: "cards",
    label: "retro",
    radius: "0px",
    shadow: "none",
  },
  // Thick outlines and offset shadows
  brutal: {
    bars: { gap: "2px", height: "26px", radius: "3px", up: "55%" },
    border: "2px solid",
    density: 1.05,
    fonts: { body: "manrope", data: "geist-mono", heading: "bricolage" },
    heading: {
      case: "none",
      stretch: "100%",
      tracking: "-0.04em",
      weight: 800,
    },
    hero: { align: "left", fill: "solid", size: "clamp(2.4rem, 7vw, 4rem)" },
    items: "cards",
    label: "brutal",
    radius: "10px",
    shadow: "5px 5px 0 var(--text)",
  },
  // Serif headlines, generous space, thin dot bars
  editorial: {
    bars: { gap: "4px", height: "16px", radius: "999px", up: "38%" },
    border: "0px solid",
    density: 1.3,
    fonts: { body: "geist", data: "geist-mono", heading: "fraunces" },
    heading: {
      case: "none",
      stretch: "100%",
      tracking: "-0.02em",
      weight: 500,
    },
    hero: { align: "center", fill: "none", size: "clamp(2.6rem, 8vw, 4.5rem)" },
    items: "cards",
    label: "editorial",
    radius: "20px",
    shadow: "0 1px 2px color-mix(in srgb, var(--text) 8%, transparent)",
  },
  // Glowing outlines on dark glass
  neon: {
    bars: { gap: "2px", height: "22px", radius: "2px", up: "40%" },
    border: "1px solid",
    density: 1,
    fonts: { body: "geist-mono", data: "geist-mono", heading: "geist" },
    heading: {
      case: "lowercase",
      stretch: "100%",
      tracking: "-0.03em",
      weight: 700,
    },
    hero: { align: "left", fill: "tint", size: "clamp(2.2rem, 7vw, 3.6rem)" },
    items: "cards",
    label: "neon",
    radius: "8px",
    shadow: "0 0 24px color-mix(in srgb, var(--main) 22%, transparent)",
  },
  // Printed report: serif titles, plex body, ruled lines
  print: {
    bars: { gap: "1px", height: "20px", radius: "0px", up: "50%" },
    border: "1px solid",
    density: 1.1,
    fonts: {
      body: "ibm-plex-sans",
      data: "ibm-plex-mono",
      heading: "fraunces",
    },
    heading: {
      case: "none",
      stretch: "100%",
      tracking: "-0.015em",
      weight: 700,
    },
    hero: { align: "left", fill: "none", size: "clamp(2.4rem, 7vw, 3.8rem)" },
    items: "rows",
    label: "print",
    radius: "2px",
    shadow: "none",
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

// Palettes adapted from each project's published colors (some tuned for contrast)
export const THEMES = {
  "catppuccin-latte": theme("Catppuccin Latte", "light", STYLES.soft, [
    "#eff1f5",
    "#e6e9ef",
    "#ccd0da",
    "#4c4f69",
    "#5c5f77",
    "#8839ef",
    "#368a24",
    "#c46a0a",
    "#d20f39",
  ]),
  "catppuccin-mocha": theme("Catppuccin Mocha", "dark", STYLES.soft, [
    "#1e1e2e",
    "#313244",
    "#45475a",
    "#cdd6f4",
    "#a6adc8",
    "#cba6f7",
    "#a6e3a1",
    "#f9e2af",
    "#f38ba8",
  ]),
  dracula: theme("Dracula", "dark", STYLES.brutal, [
    "#282a36",
    "#343746",
    "#44475a",
    "#f8f8f2",
    "#a2acd0",
    "#bd93f9",
    "#50fa7b",
    "#ffb86c",
    "#ff5555",
  ]),
  "gruvbox-dark": theme("Gruvbox Dark", "dark", STYLES.retro, [
    "#282828",
    "#3c3836",
    "#504945",
    "#ebdbb2",
    "#a89984",
    "#d79921",
    "#b8bb26",
    "#fe8019",
    "#fb4934",
  ]),
  "gruvbox-light": theme("Gruvbox Light", "light", STYLES.retro, [
    "#fbf1c7",
    "#f2e5bc",
    "#d5c4a1",
    "#3c3836",
    "#665c54",
    "#9d6a0f",
    "#5f6b0b",
    "#af3a03",
    "#9d0006",
  ]),
  nord: theme("Nord", "dark", STYLES.swiss, [
    "#2e3440",
    "#3b4252",
    "#4c566a",
    "#eceff4",
    "#d8dee9",
    "#88c0d0",
    "#a3be8c",
    "#ebcb8b",
    "#d08770",
  ]),
  "pilotlight-day": theme("Pilotlight Day", "light", STYLES.instrument, [
    "#f7f8fa",
    "#ffffff",
    "#dde1e6",
    "#16191d",
    "#545c67",
    "#1f6fd1",
    "#1f8a52",
    "#9a5c00",
    "#c2362f",
  ]),
  "pilotlight-night": theme("Pilotlight Night", "dark", STYLES.instrument, [
    "#121417",
    "#1a1d21",
    "#2a2e34",
    "#e6e8eb",
    "#8b93a0",
    "#5aa9ff",
    "#3fbf7f",
    "#e5a54b",
    "#ef6a5f",
  ]),
  "rose-pine": theme("Rosé Pine", "dark", STYLES.editorial, [
    "#191724",
    "#1f1d2e",
    "#26233a",
    "#e0def4",
    "#908caa",
    "#c4a7e7",
    "#9ccfd8",
    "#f6c177",
    "#eb6f92",
  ]),
  "rose-pine-dawn": theme("Rosé Pine Dawn", "light", STYLES.editorial, [
    "#faf4ed",
    "#fffaf3",
    "#f2e9e1",
    "#575279",
    "#6e6a86",
    "#907aa9",
    "#286983",
    "#b36b10",
    "#b4637a",
  ]),
  "solarized-light": theme("Solarized Light", "light", STYLES.print, [
    "#fdf6e3",
    "#eee8d5",
    "#ddd6c1",
    "#4f6168",
    "#657b83",
    "#1f6fa8",
    "#6b7a00",
    "#8f6c00",
    "#c42a28",
  ]),
  "tokyo-night": theme("Tokyo Night", "dark", STYLES.neon, [
    "#1a1b26",
    "#24283b",
    "#414868",
    "#c0caf5",
    "#8a91b8",
    "#7aa2f7",
    "#9ece6a",
    "#e0af68",
    "#f7768e",
  ]),
} satisfies Record<string, Theme>;

export type ThemeId = keyof typeof THEMES;

export const DEFAULT_THEMES = {
  dark: "pilotlight-night",
  light: "pilotlight-day",
} as const satisfies Record<Theme["mode"], ThemeId>;

export const isThemeId = (id: string): id is ThemeId => id in THEMES;

const HERO_FILL = {
  none: ["transparent", "var(--text)", "0px solid transparent"],
  solid: ["var(--main)", "var(--bg)", "var(--edge) var(--text)"],
  surface: ["var(--surface)", "var(--text)", "var(--edge) var(--line)"],
  tint: [
    "color-mix(in srgb, var(--main) 12%, var(--bg))",
    "var(--text)",
    "var(--edge) color-mix(in srgb, var(--main) 45%, transparent)",
  ],
} as const;

/** Every CSS variable a theme sets; styles.css only ever reads these */
export function themeVars({
  colors,
  mode,
  style,
}: Theme): Record<string, string> {
  const cards = style.items === "cards";
  const [heroBg, heroFg, heroBorder] = HERO_FILL[style.hero.fill];
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
    "heading-stretch": style.heading.stretch,
    "heading-tracking": style.heading.tracking,
    "heading-weight": String(style.heading.weight),
    "hero-align": style.hero.align,
    "hero-items": style.hero.align === "center" ? "center" : "flex-start",
    "hero-bg": heroBg,
    "hero-border":
      style.hero.fill === "none" ? "0px solid transparent" : heroBorder,
    "hero-fg": heroFg,
    "hero-shadow": style.hero.fill === "none" ? "none" : style.shadow,
    "hero-pad": style.hero.fill === "none" ? "0px" : "clamp(1.5rem, 5vw, 3rem)",
    "hero-size": style.hero.size,
    "item-bg": cards ? "var(--surface)" : "transparent",
    "item-border": cards ? "var(--edge) var(--line)" : "0px solid transparent",
    "item-divider": cards ? "0px solid transparent" : "var(--edge) var(--line)",
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

/** CSS for the chosen pair: light by default, dark when the visitor's OS prefers it */
export function themeCss(darkId: string, lightId: string) {
  const dark = THEMES[isThemeId(darkId) ? darkId : DEFAULT_THEMES.dark];
  const light = THEMES[isThemeId(lightId) ? lightId : DEFAULT_THEMES.light];
  // html:root outranks the :root fallback in styles.css whatever the load order
  return `html:root{${declarations(light)}}@media (prefers-color-scheme:dark){html:root{${declarations(dark)}}}`;
}
