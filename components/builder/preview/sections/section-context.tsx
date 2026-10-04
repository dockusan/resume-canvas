"use client";

import { createContext, useContext } from "react";
import {
  BorderSpec,
  FieldSpec,
  HeadingStyle,
  SeparatorStyle,
  SectionNode,
  Theme,
  fontSizeAt,
} from "@/lib/schema/document";
import { ON_FILL_LINE, ON_FILL_TEXT } from "@/lib/schema/defaults";
import { contrastRatio, isDarkFill } from "@/lib/schema/css";
import type { CSSProperties } from "react";

export interface SectionContextValue {
  node: SectionNode;
  theme: Theme;
  /** The section sits on a dark column fill, so text must invert. */
  onFill: boolean;
}

const SectionContext = createContext<SectionContextValue | null>(null);

export const SectionProvider = SectionContext.Provider;

export function useSection(): SectionContextValue {
  const ctx = useContext(SectionContext);
  if (!ctx) {
    throw new Error("Section primitives must be used inside a SectionShell");
  }
  return ctx;
}

/** Resolved palette for the surface this section sits on. */
export function useSectionColors() {
  const { theme, onFill } = useSection();
  return {
    text: onFill ? theme.colors.onFill : theme.colors.text,
    muted: onFill ? theme.colors.onFill : theme.colors.muted,
    accent: onFill ? theme.colors.onFill : theme.colors.accent,
    heading: onFill ? theme.colors.onFill : theme.colors.heading,
    border: onFill ? "rgba(255,255,255,0.2)" : theme.colors.border,
    chip: onFill ? "rgba(255,255,255,0.2)" : `${theme.colors.accent}15`,
  };
}

export function fieldSpec(
  node: SectionNode,
  key: string,
): FieldSpec | undefined {
  return node.fields?.[key];
}

export function isFieldVisible(node: SectionNode, key: string): boolean {
  return node.fields?.[key]?.visible !== false;
}

/**
 * Typography for one field, resolved from the theme's type scale rather than
 * the `base - 1 / -2 / -3` arithmetic that used to be hardcoded per section.
 */
export function useFieldStyle(
  key: string,
  fallback?: CSSProperties,
): CSSProperties {
  const { node, theme } = useSection();
  const spec = fieldSpec(node, key);
  // The caller's style is the default; an explicit per-field choice in the
  // spec must win over it, or field colour and weight could never apply.
  return {
    fontSize: fontSizeAt(theme, spec?.step ?? 0),
    ...fallback,
    ...(spec?.color ? { color: spec.color } : {}),
    ...(spec?.weight ? { fontWeight: spec.weight } : {}),
  };
}

/**
 * Keep section colours readable against whatever surface they land on.
 *
 * A section can arrive carrying the *other* column's styling — created in
 * Classic's dark sidebar and later moved to a white column, or the reverse —
 * and the stored colour is then invisible. Rather than rewriting the stored
 * style (which would discard a deliberate choice), the colour is corrected at
 * render time, and only when it is genuinely unreadable: anything with usable
 * contrast is left exactly as chosen.
 */

/** Approximate luminance of the two surfaces a section can sit on. */
const DARK_SURFACE = "#1f2937";
const LIGHT_SURFACE = "#ffffff";

/** Below this ratio the text is effectively invisible. */
const MIN_TEXT_CONTRAST = 2;
/** Hairlines are meant to be faint, so they get a far lower bar. */
const MIN_LINE_CONTRAST = 1.08;

function readableText(color: string, onFill: boolean, theme: Theme): string {
  const surface = onFill ? DARK_SURFACE : LIGHT_SURFACE;
  if (contrastRatio(color, surface) >= MIN_TEXT_CONTRAST) return color;
  return onFill ? ON_FILL_TEXT : theme.colors.heading;
}

function readableLine(color: string, onFill: boolean, theme: Theme): string {
  const surface = onFill ? DARK_SURFACE : LIGHT_SURFACE;
  if (contrastRatio(color, surface) >= MIN_LINE_CONTRAST) return color;
  return onFill ? ON_FILL_LINE : theme.colors.border;
}

function adaptBorder(
  border: BorderSpec | null,
  theme: Theme,
  onFill: boolean,
): BorderSpec | null {
  if (!border) return border;
  const color = readableLine(border.color, onFill, theme);
  return color === border.color ? border : { ...border, color };
}

export function adaptHeadingToFill(
  heading: HeadingStyle,
  theme: Theme,
  onFill: boolean,
): HeadingStyle {
  // A filled heading (pill, boxed) sits on its own background, so its text is
  // judged against that rather than the column.
  const onOwnFill =
    heading.background.type !== "none"
      ? isDarkFill(heading.background)
      : onFill;
  return {
    ...heading,
    color: readableText(heading.color, onOwnFill, theme),
    border: adaptBorder(heading.border, theme, onFill),
  };
}

export function adaptSeparatorToFill(
  separator: SeparatorStyle,
  theme: Theme,
  onFill: boolean,
): SeparatorStyle {
  const color = readableLine(separator.color, onFill, theme);
  return color === separator.color ? separator : { ...separator, color };
}

export function adaptRailColor(
  color: string,
  theme: Theme,
  onFill: boolean,
): string {
  return readableLine(color, onFill, theme);
}
