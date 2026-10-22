import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function darkenColor(hexColor: string, factor: number = 0.7): string {
  let color = hexColor.replace("#", "");

  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const r = Math.max(
    0,
    Math.min(255, Math.floor(parseInt(color.substring(0, 2), 16) * factor)),
  );
  const g = Math.max(
    0,
    Math.min(255, Math.floor(parseInt(color.substring(2, 4), 16) * factor)),
  );
  const b = Math.max(
    0,
    Math.min(255, Math.floor(parseInt(color.substring(4, 6), 16) * factor)),
  );

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * A pale version of a colour, as if laid over white at `strength` opacity
 * (0 = white, 1 = the colour itself). Opaque, so it reads the same in print
 * and fill-contrast checks treat it as the light fill it is.
 */
export function tintColor(hexColor: string, strength: number): string {
  let color = hexColor.replace("#", "");
  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const channel = (i: number) => {
    const c = parseInt(color.substring(i, i + 2), 16);
    return Math.round(255 + (c - 255) * strength)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

/**
 * A URL as it should read on paper: no scheme, no "www.", no trailing slash.
 * "https://www.linkedin.com/in/jane/" → "linkedin.com/in/jane".
 */
export function shortUrl(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}
