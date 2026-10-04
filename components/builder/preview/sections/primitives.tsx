"use client";

import { EditableText } from "@/components/builder/inline/editable-text";
import { ItemChrome } from "@/components/builder/inline/item-chrome";
import { SectionKey } from "@/lib/store/useResumeStore";
import { boxStyle, itemLayoutStyle, separatorStyle } from "@/lib/schema/css";
import { spacingOf } from "@/lib/schema/document";
import { cn } from "@/lib/utils";
import { DocIcon } from "./doc-icon";
import type { CSSProperties } from "react";
import {
  adaptRailColor,
  adaptSeparatorToFill,
  isFieldVisible,
  useFieldStyle,
  useSection,
  useSectionColors,
} from "./section-context";

/** In-document icon; re-exported so section files import one thing. */
export { DocIcon as Icon } from "./doc-icon";

/** Flex or grid flow for a section's items, straight from `node.items`. */
export function ItemFlow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { node, theme } = useSection();
  // Only a vertical stack gets the item-spacing multiplier; chips and grids
  // keep their designed gutters.
  const stacked = !node.items.columns && node.items.direction === "column";
  const items = stacked
    ? { ...node.items, gap: node.items.gap * spacingOf(theme).item }
    : node.items;
  return (
    <div className={className} style={itemLayoutStyle(items)}>
      {children}
    </div>
  );
}

/** The timeline dot / bar drawn at an item's leading edge. */
function Marker() {
  const { node } = useSection();
  const marker = node.style.marker;
  if (marker.kind === "none" || marker.size <= 0) return null;

  const shape: CSSProperties =
    marker.kind === "bar"
      ? { width: Math.max(2, marker.size / 3), height: marker.size * 1.6 }
      : { width: marker.size, height: marker.size };

  const radius =
    marker.kind === "square"
      ? 0
      : marker.kind === "bar"
        ? marker.size
        : "9999px";

  return (
    <span
      aria-hidden
      className="absolute"
      style={{
        ...shape,
        left: marker.offset,
        top: "0.4em",
        borderRadius: radius,
        ...(marker.kind === "ring"
          ? {
              background: "transparent",
              border: `2px solid ${marker.color}`,
            }
          : { background: marker.color }),
      }}
    />
  );
}

export interface ItemProps {
  sectionKey: SectionKey;
  itemId: string;
  index: number;
  count: number;
  /** Compact chrome for chip-sized items (skills). */
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
}

/**
 * One item: editor chrome plus the schema's item box, timeline rail, marker
 * and the separator drawn between items.
 */
export function Item({
  sectionKey,
  itemId,
  index,
  count,
  compact,
  className,
  style,
  children,
}: ItemProps) {
  const { node, theme, onFill } = useSection();
  const { marker, itemBox, separator } = node.style;
  const rail = marker.rail;

  const merged: CSSProperties = {
    ...boxStyle(itemBox),
    ...(rail?.enabled
      ? {
          borderLeft: `${rail.width}px solid ${adaptRailColor(
            rail.color,
            theme,
            onFill,
          )}`,
        }
      : {}),
    // Separators sit between items, so the first one never gets a rule.
    ...(index > 0
      ? separatorStyle(
          adaptSeparatorToFill(
            {
              ...separator,
              spacing: separator.spacing * spacingOf(theme).item,
            },
            theme,
            onFill,
          ),
        )
      : {}),
    ...style,
  };

  return (
    <ItemChrome
      sectionKey={sectionKey}
      itemId={itemId}
      index={index}
      count={count}
      compact={compact}
      className={cn("relative", className)}
      style={merged}
    >
      {!compact && <Marker />}
      {children}
    </ItemChrome>
  );
}

export interface FieldProps {
  /** Key into `node.fields` — drives visibility, icon and type scale. */
  name: string;
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  as?: React.ElementType;
  className?: string;
  style?: CSSProperties;
  /** Style-override path, so per-field tweaks keep working. */
  path?: string;
  iconClassName?: string;
}

/**
 * An inline-editable field. Hidden when the section controller turns it off,
 * and sized from the theme's type scale rather than a hardcoded number.
 */
export function Field({
  name,
  value,
  onCommit,
  placeholder,
  multiline,
  as,
  className,
  style,
  path,
  iconClassName,
}: FieldProps) {
  const { node } = useSection();
  const resolved = useFieldStyle(name, style);
  if (!isFieldVisible(node, name)) return null;

  // Whatever icon the section controller assigned to this field, render it.
  const icon = node.fields?.[name]?.icon ?? null;
  const text = (
    <EditableText
      value={value}
      onCommit={onCommit}
      placeholder={placeholder}
      multiline={multiline}
      as={as}
      className={className}
      style={icon ? undefined : resolved}
      path={path}
    />
  );

  if (!icon) return text;
  // An inline-flex wrapper would establish its own baseline and sit a couple
  // of pixels off the text beside it, so the glyph is aligned inline instead.
  return (
    <span style={resolved}>
      <DocIcon
        name={icon}
        className={cn("inline-block shrink-0", iconClassName)}
        style={{
          width: "1em",
          height: "1em",
          verticalAlign: "-0.125em",
          marginRight: "0.25em",
        }}
      />
      {text}
    </span>
  );
}

/** Text that is not editable (separators, units, computed labels). */
export function Muted({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const colors = useSectionColors();
  return (
    <span className={className} style={{ color: colors.muted, ...style }}>
      {children}
    </span>
  );
}

/** Title-left / date-right row used by most narrative sections. */
export function ItemHeaderRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex justify-between items-baseline gap-2 min-w-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
