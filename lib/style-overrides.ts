import { StyleOverride } from "./types";

/** HTML px per PDF point (matches getBaseStyles scaling). */
export const HTML_SCALE = 1.333;

/**
 * Merge overrides along a path cascade, least → most specific:
 * "experience.<itemId>.title" → experience, experience.<itemId>, full path.
 * Also used for "personalInfo.fullName" (header cascade via "personalInfo")
 * and "<sectionId>.heading".
 */
export function resolvePathOverride(
  overrides: Record<string, StyleOverride> | undefined,
  path?: string,
): StyleOverride {
  if (!overrides || !path) return {};
  const merged: StyleOverride = {};
  // Custom section ids ("custom:<uuid>") contain no dots, so "." is a safe separator.
  const parts = path.split(".");
  let prefix = "";
  for (const part of parts) {
    prefix = prefix ? `${prefix}.${part}` : part;
    const override = overrides[prefix];
    if (override) Object.assign(merged, override);
  }
  return merged;
}

/**
 * Apply an override on top of an existing inline style. fontSizeDelta is in
 * PDF points; when the base has no numeric fontSize the delta is applied
 * relative to the inherited size via calc(1em + Npx).
 */
export function applyHtmlOverride(
  style: React.CSSProperties | undefined,
  override: StyleOverride,
): React.CSSProperties {
  const out: React.CSSProperties = { ...style };
  if (override.fontSizeDelta) {
    const deltaPx = override.fontSizeDelta * HTML_SCALE;
    out.fontSize =
      typeof out.fontSize === "number"
        ? out.fontSize + deltaPx
        : `calc(1em + ${deltaPx}px)`;
  }
  if (override.color) out.color = override.color;
  if (override.fontWeight) out.fontWeight = override.fontWeight;
  return out;
}

/** react-pdf variant: deltas applied in points on numeric fontSize. */
export function applyPdfOverride(
  style: Record<string, unknown>,
  override: StyleOverride,
): Record<string, unknown> {
  const out = { ...style };
  if (override.fontSizeDelta && typeof out.fontSize === "number") {
    out.fontSize = (out.fontSize as number) + override.fontSizeDelta;
  }
  if (override.color) out.color = override.color;
  if (override.fontWeight) out.fontWeight = override.fontWeight;
  return out;
}
