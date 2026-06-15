/**
 * Colour helpers for tenant branding.
 *
 * Branding colours are author-supplied and can be anything — including
 * near-white values like "#fcfffa" that are unusable as a filled CTA
 * background (invisible on a white page) and produce illegible white-on-white
 * button labels. These helpers keep branded UI legible regardless of the colour
 * a tenant picks.
 */

function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** Relative luminance per WCAG 2.x (0 = black, 1 = white). null if unparsable. */
function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}

/**
 * Returns a foreground colour (dark or light) that stays legible on top of the
 * given background. Falls back to light text for unparsable input.
 */
export function readableTextColor(
  bg: string,
  dark = "#111111",
  light = "#ffffff"
): string {
  const lum = relativeLuminance(bg);
  if (lum === null) return light;
  return lum > 0.5 ? dark : light;
}

/**
 * True when a colour is too light to work as a filled CTA background / accent on
 * a white page (e.g. near-white brand colours). Callers fall back to the app's
 * default styling in that case.
 */
export function isLightColor(hex: string, threshold = 0.75): boolean {
  const lum = relativeLuminance(hex);
  return lum !== null && lum > threshold;
}
