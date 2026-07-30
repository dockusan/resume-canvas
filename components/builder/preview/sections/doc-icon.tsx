"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ICON_STROKE_WIDTH, getIconData } from "@/lib/icons";
import type { CSSProperties } from "react";

/**
 * An icon inside the resume.
 *
 * One component so every icon shares a stroke weight and sizing rule; call
 * sites pass a name and a class, never stroke or viewBox details.
 *
 * `absoluteStrokeWidth` is deliberately not set — it rescales the stroke by
 * icon size, which is the very inconsistency a fixed weight exists to avoid.
 */
export function DocIcon({
  name,
  className,
  style,
  size,
}: {
  name?: string | null;
  className?: string;
  style?: CSSProperties;
  size?: number;
}) {
  const icon = name ? getIconData(name) : null;
  if (!icon) return null;
  return (
    <HugeiconsIcon
      icon={icon}
      className={className}
      style={style}
      size={size}
      strokeWidth={ICON_STROKE_WIDTH}
    />
  );
}
