import { StyleOverride } from "./types";

/** Smallest size a nudge may take text down to, in px. */
const MIN_FONT_PX = 7;

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
 * px, like every other size in the document; when the base has no numeric
 * fontSize the delta is applied relative to the inherited size.
 */
export function applyHtmlOverride(
  style: React.CSSProperties | undefined,
  override: StyleOverride,
): React.CSSProperties {
  const out: React.CSSProperties = { ...style };
  if (override.fontSizeDelta) {
    const deltaPx = override.fontSizeDelta;
    out.fontSize =
      typeof out.fontSize === "number"
        ? Math.max(MIN_FONT_PX, out.fontSize + deltaPx)
        : `max(${MIN_FONT_PX}px, calc(1em + ${deltaPx}px))`;
  }
  if (override.color) out.color = override.color;
  if (override.fontWeight) out.fontWeight = override.fontWeight;
  return out;
}
