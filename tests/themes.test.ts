import { describe, expect, test } from "bun:test";
import { THEMES, themeCss } from "../src/lib/themes";

// WCAG 2 relative luminance and contrast ratio
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("every theme is readable", () => {
  for (const [id, { colors }] of Object.entries(THEMES)) {
    test(id, () => {
      // body text: WCAG AA for normal text
      expect(contrast(colors.text, colors.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.text, colors.surface)).toBeGreaterThanOrEqual(4.5);
      // secondary text, accent and status colors: AA for large text / UI parts
      for (const token of ["sub", "main", "up", "warn", "down"] as const) {
        expect(contrast(colors[token], colors.bg)).toBeGreaterThanOrEqual(3);
      }
    });
  }
});

test("themeCss falls back to defaults for unknown ids", () => {
  const css = themeCss("nope", "also-nope");
  expect(css).toContain(THEMES["pilotlight-light"].colors.bg);
  expect(css).toContain(THEMES["pilotlight-dark"].colors.bg);
  expect(css).toContain("prefers-color-scheme:dark");
});
