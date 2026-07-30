"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface EditingContextValue {
  /** Whether the preview is an editing surface (false = plain render). */
  editable: boolean;
  /** Style-override path of the field/item/section that currently has focus. */
  activePath: string | null;
  /** DOM node of the focused field, used to anchor the field style button. */
  activeEl: HTMLElement | null;
  setActivePath: (path: string | null, el?: HTMLElement | null) => void;
}

const EditingContext = createContext<EditingContextValue>({
  editable: false,
  activePath: null,
  activeEl: null,
  setActivePath: () => {},
});

export function EditingProvider({
  editable = true,
  children,
}: {
  editable?: boolean;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<{
    path: string | null;
    el: HTMLElement | null;
  }>({ path: null, el: null });

  const setActivePath = useCallback(
    (path: string | null, el?: HTMLElement | null) =>
      setActive({ path, el: el ?? null }),
    [],
  );

  return (
    <EditingContext.Provider
      value={{
        editable,
        activePath: active.path,
        activeEl: active.el,
        setActivePath,
      }}
    >
      {children}
    </EditingContext.Provider>
  );
}

export const useEditing = () => useContext(EditingContext);

/**
 * Selection helpers. Paths are dotted: "experience",
 * "experience.<itemId>", "experience.<itemId>.title", "personalInfo.email".
 * Only the innermost matching controller should be shown, so a section is
 * "active" only when the selection is the section itself or its heading.
 */
export function isSectionActive(
  activePath: string | null,
  sectionId: string,
): boolean {
  return activePath === sectionId || activePath === `${sectionId}.heading`;
}

export function isItemActive(
  activePath: string | null,
  sectionKey: string,
  itemId: string,
): boolean {
  if (!activePath) return false;
  const prefix = `${sectionKey}.${itemId}`;
  return activePath === prefix || activePath.startsWith(`${prefix}.`);
}

export function isPersonalActive(activePath: string | null): boolean {
  return (
    activePath === "personalInfo" || !!activePath?.startsWith("personalInfo.")
  );
}

/** True for field-level paths (section.item.field or personalInfo.field). */
export function isFieldPath(activePath: string | null): boolean {
  if (!activePath) return false;
  if (activePath.endsWith(".heading")) return false;
  const rest = activePath.startsWith("custom:")
    ? activePath.slice("custom:".length)
    : activePath;
  const depth = rest.split(".").length;
  // personalInfo.email -> 2, experience.<id>.title -> 3
  return activePath.startsWith("personalInfo.") ? depth === 2 : depth >= 3;
}
