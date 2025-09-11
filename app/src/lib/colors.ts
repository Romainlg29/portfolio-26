import { Color } from "three";
import { lerp } from "./math";

export const lerpColor = (a: string, b: string, t: number) => {
  // Fallback: linear RGB interpolation using three.js
  const colorA = new Color(a);
  const colorB = new Color(b);
  colorA.lerp(colorB, t);
  return colorA.getStyle();
};

// TODO: Use https://culorijs.org/ instead
// Minimal oklch parser: accepts oklch(l c h) or oklch(l c h / a)
export function parseOklch(str: string) {
  // Remove 'oklch(' and ')' and split
  const match = str.match(/oklch\(([^)]+)\)/);
  if (!match) throw new Error("Invalid oklch string: " + str);
  const parts = match[1].split("/")[0].trim().split(/\s+/);
  return {
    l: parseFloat(parts[0]),
    c: parseFloat(parts[1]),
    h: parseFloat(parts[2]),
  };
}

export function formatOklch({ l, c, h }: { l: number; c: number; h: number }) {
  // Clamp values for safety
  l = Math.max(0, Math.min(1, l));
  c = Math.max(0, c);
  // h can wrap
  return `oklch(${l} ${c} ${h})`;
}

export function lerpOklch(a: string, b: string, t: number) {
  const ca = parseOklch(a);
  const cb = parseOklch(b);
  // Interpolate l, c, h (hue wraps around 360)
  const l = lerp(ca.l, cb.l, t);
  const c = lerp(ca.c, cb.c, t);
  let dh = cb.h - ca.h;
  if (Math.abs(dh) > 180) dh -= Math.sign(dh) * 360;
  const h = (ca.h + dh * t + 360) % 360;
  return formatOklch({ l, c, h });
}
