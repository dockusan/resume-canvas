"use client";

import { createContext, useContext } from "react";
import {
  FieldSpec,
  SectionNode,
  Theme,
  fontSizeAt,
} from "@/lib/schema/document";
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
  return {
    fontSize: fontSizeAt(theme, spec?.step ?? 0),
    ...(spec?.color ? { color: spec.color } : {}),
    ...(spec?.weight ? { fontWeight: spec.weight } : {}),
    ...fallback,
  };
}
