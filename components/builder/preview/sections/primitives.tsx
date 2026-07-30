"use client";

import { EditableText } from "@/components/builder/inline/editable-text";
import { ItemChrome } from "@/components/builder/inline/item-chrome";
import { SectionKey } from "@/lib/store/useResumeStore";
import { boxStyle, itemLayoutStyle, separatorStyle } from "@/lib/schema/css";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import type { CSSProperties } from "react";
import {
  adaptRailColor,
  adaptSeparatorToFill,
  isFieldVisible,
  useFieldStyle,
  useSection,
  useSectionColors,
} from "./section-context";

type IconName = keyof typeof Icons;

/** Renders a lucide icon by name; unknown names render nothing. */
export function Icon({
  name,
  className,
  style,
}: {
  name?: string | null;
  className?: string;
  style?: CSSProperties;
}) {
  if (!name) return null;
  const Cmp = Icons[name as IconName] as
    | React.ComponentType<{ className?: string; style?: CSSProperties }>
    | undefined;
  if (!Cmp) return null;
  return <Cmp className={className} style={style} />;
}

/** Flex or grid flow for a section's items, straight from `node.items`. */
export function ItemFlow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { node } = useSection();
  return (
    <div className={className} style={itemLayoutStyle(node.items)}>
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
      ? separatorStyle(adaptSeparatorToFill(separator, theme, onFill))
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
  /** Render the field's icon before the text. */
  withIcon?: boolean;
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
  withIcon,
  iconClassName,
}: FieldProps) {
  const { node } = useSection();
  const resolved = useFieldStyle(name, style);
  if (!isFieldVisible(node, name)) return null;

  const icon = withIcon ? node.fields?.[name]?.icon : null;
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
      <Icon
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
