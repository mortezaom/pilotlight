// Admin-selectable themes, Monkeytype style: each theme is nine colors and
// every other color in the UI is derived from them in styles.css.

export const THEME_TOKENS = [
  "bg", // page background
  "surface", // inputs, dialogs, raised areas
  "line", // dividers and borders
  "text", // main text
  "sub", // secondary text, empty history bars
  "main", // accent: links, buttons, focus
  "up", // operational
  "warn", // timeout, degraded
  "down", // down, errors, destructive actions
] as const;

export type ThemeColors = Record<(typeof THEME_TOKENS)[number], string>;
export type Theme = {
  name: string;
  mode: "dark" | "light";
  colors: ThemeColors;
};

const theme = (
  name: string,
  mode: Theme["mode"],
  [bg, surface, line, text, sub, main, up, warn, down]: string[]
): Theme => ({
  colors: { bg, down, line, main, sub, surface, text, up, warn },
  mode,
  name,
});

// Palettes adapted from each project's published colors
export const THEMES = {
  "catppuccin-latte": theme("Catppuccin Latte", "light", [
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
  "catppuccin-mocha": theme("Catppuccin Mocha", "dark", [
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
  dracula: theme("Dracula", "dark", [
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
  "gruvbox-dark": theme("Gruvbox Dark", "dark", [
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
  "gruvbox-light": theme("Gruvbox Light", "light", [
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
  nord: theme("Nord", "dark", [
    "#2e3440",
    "#3b4252",
    "#434c5e",
    "#eceff4",
    "#d8dee9",
    "#88c0d0",
    "#a3be8c",
    "#ebcb8b",
    "#d08770",
  ]),
  "pilotlight-day": theme("Pilotlight Day", "light", [
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
  "pilotlight-night": theme("Pilotlight Night", "dark", [
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
  "rose-pine": theme("Rosé Pine", "dark", [
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
  "rose-pine-dawn": theme("Rosé Pine Dawn", "light", [
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
  "solarized-light": theme("Solarized Light", "light", [
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
  "tokyo-night": theme("Tokyo Night", "dark", [
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

const vars = ({ colors, mode }: Theme) =>
  `${Object.entries(colors)
    .map(([token, value]) => `--${token}:${value}`)
    .join(";")};color-scheme:${mode}`;

/** CSS for the chosen pair: light by default, dark when the visitor's OS prefers it */
export function themeCss(darkId: string, lightId: string) {
  const dark = THEMES[isThemeId(darkId) ? darkId : DEFAULT_THEMES.dark];
  const light = THEMES[isThemeId(lightId) ? lightId : DEFAULT_THEMES.light];
  // html:root outranks the :root fallback in styles.css whatever the load order
  return `html:root{${vars(light)}}@media (prefers-color-scheme:dark){html:root{${vars(dark)}}}`;
}
