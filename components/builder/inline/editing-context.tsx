"use client";

import { createContext, useContext, useState } from "react";

interface EditingContextValue {
  /** Whether the preview is an editing surface (false = plain render). */
  editable: boolean;
  /** Style-override path of the field/item/section that currently has focus. */
  activePath: string | null;
  setActivePath: (path: string | null) => void;
}

const EditingContext = createContext<EditingContextValue>({
  editable: false,
  activePath: null,
  setActivePath: () => {},
});

export function EditingProvider({
  editable = true,
  children,
}: {
  editable?: boolean;
  children: React.ReactNode;
}) {
  const [activePath, setActivePath] = useState<string | null>(null);
  return (
    <EditingContext.Provider value={{ editable, activePath, setActivePath }}>
      {children}
    </EditingContext.Provider>
  );
}

export const useEditing = () => useContext(EditingContext);
