"use client";

import { EditableText } from "@/components/builder/inline/editable-text";
import { useEditing } from "@/components/builder/inline/editing-context";
import { SectionChrome } from "@/components/builder/inline/section-chrome";
import {
  SectionKey,
  isCustomSectionId,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { SectionConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { SectionStyleConfig } from "../layouts/types";

interface SectionShellProps {
  section: SectionConfig;
  config?: SectionStyleConfig;
  /** When true, renders a dashed placeholder instead of children so an
   *  emptied section stays visible (and editable) in the preview. */
  isEmpty?: boolean;
  children?: React.ReactNode;
}

export function SectionShell({
  section,
  config,
  isEmpty,
  children,
}: SectionShellProps) {
  const { editable } = useEditing();
  const renameSection = useResumeStore((s) => s.renameSection);
  const addItem = useResumeStore((s) => s.addItem);

  // Every item-backed section's key is its id; "summary" has no items.
  const sectionKey: SectionKey | null =
    section.id === "summary" ? null : (section.id as SectionKey);
  const isItemSection =
    sectionKey !== null &&
    (isCustomSectionId(section.id) || section.id !== "summary");

  return (
    <section
      className={cn(config?.className, editable && "relative group/section")}
    >
      {editable && <SectionChrome section={section} />}
      <h2 className={config?.headerClass} style={config?.headerStyle}>
        <EditableText
          value={section.name}
          onCommit={(name) => {
            if (name) renameSection(section.id, name);
          }}
          placeholder="Section title"
          path={`${section.id}.heading`}
        />
      </h2>
      {isEmpty ? (
        editable && isItemSection && sectionKey ? (
          <button
            type="button"
            onClick={() => addItem(sectionKey)}
            className="w-full border border-dashed rounded-md px-3 py-2 text-xs opacity-50 hover:opacity-90 flex items-center justify-center gap-1"
            style={{ color: config?.textColor || "#3e3e3e" }}
          >
            <Plus className="w-3 h-3" /> Add item
          </button>
        ) : (
          <div
            className="border border-dashed rounded-md px-3 py-2 text-xs opacity-50"
            style={{ color: config?.textColor || "#3e3e3e" }}
          >
            Empty section
          </div>
        )
      ) : (
        children
      )}
    </section>
  );
}
