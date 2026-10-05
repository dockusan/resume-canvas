"use client";

import {
  isPersonalActive,
  useEditing,
} from "@/components/builder/inline/editing-context";
import { StylePopover } from "@/components/builder/inline/style-toolbar";
import { useDocument } from "@/lib/schema/use-document";
import { cn } from "@/lib/utils";
import {
  FileText,
  LayoutPanelLeft,
  PanelRightClose,
  ShieldCheck,
  User,
} from "lucide-react";
import { useState } from "react";
import { AtsPanel } from "./ats-panel";
import { DocumentPanel } from "./document-panel";
import { HeaderPanel } from "./header-panel";
import { SectionPanel } from "./section-panel";
import { SectionsOutline } from "./sections-outline";

type Tab = "document" | "selection" | "ats";

/**
 * Contextual property panel.
 *
 * The canvas owns *what* you are editing (via `activePath`); this owns *how*.
 * Selecting a section or the header switches the panel to it, so the schema
 * surface added in earlier phases is reachable without cramming it into the
 * floating toolbars.
 */
export function Inspector({
  open,
  onOpenChange,
  pageCount = 1,
}: {
  /** Drawer state below the desktop breakpoint; docked panel above it. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pages the document currently prints to, for the ATS length check. */
  pageCount?: number;
}) {
  const { activePath } = useEditing();
  const doc = useDocument();
  const [tab, setTab] = useState<Tab>("selection");

  const sectionId = doc.sections.find(
    (s) => activePath === s.id || activePath?.startsWith(`${s.id}.`),
  )?.id;
  const node = doc.sections.find((s) => s.id === sectionId);
  const personal = isPersonalActive(activePath);

  // A selection deeper than the section itself can carry its own override:
  // "experience.<id>" targets one item, "experience.<id>.title" one field.
  const override = (() => {
    if (!activePath || !sectionId) return null;
    const rest = activePath.slice(sectionId.length).replace(/^\./, "");
    if (!rest || rest === "heading") return null;
    const depth = rest.split(".").length;
    return {
      path: activePath,
      label: depth > 1 ? "Override — this field" : "Override — this item",
      action: depth > 1 ? "Style this field only" : "Style this item only",
    };
  })();

  const showSelection = tab === "selection" && (node || personal);

  return (
    <>
      {/* Below lg the panel is a drawer over the canvas: docking it would
          leave a 70px-wide page on a phone. */}
      {open && (
        <button
          type="button"
          aria-label="Close properties"
          data-editor-only
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}
      <aside
        data-editor-only
        data-keeps-selection
        className={cn(
          "border-l bg-card flex-col h-full",
          // Wider than it was: the panel's type was stepped up a size, and at
          // 288px the label/control rows had no slack left to absorb it.
          "lg:static lg:flex lg:w-80 lg:shrink-0 lg:shadow-none",
          open
            ? "fixed inset-y-0 right-0 z-50 flex w-[86vw] max-w-sm shadow-2xl"
            : "hidden",
        )}
      >
        <div className="flex items-center gap-1 p-2 border-b">
          <TabButton
            active={tab === "document"}
            onClick={() => setTab("document")}
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Document"
          />
          <TabButton
            active={tab === "selection"}
            onClick={() => setTab("selection")}
            icon={
              personal ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                <LayoutPanelLeft className="w-3.5 h-3.5" />
              )
            }
            label={personal ? "Header" : node ? "Section" : "Sections"}
          />
          <TabButton
            active={tab === "ats"}
            onClick={() => setTab("ats")}
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            label="ATS"
          />
          <button
            type="button"
            title="Hide properties"
            onClick={() => onOpenChange(false)}
            className="ml-auto h-8 w-8 rounded hover:bg-muted flex items-center justify-center lg:hidden"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {tab === "document" && <DocumentPanel />}
          {tab === "ats" && <AtsPanel pageCount={pageCount} />}
          {showSelection && personal && <HeaderPanel />}
          {showSelection && !personal && node && (
            <>
              <div className="px-3 pt-3">
                <div className="text-[15px] font-medium truncate">
                  {node.title}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {node.placement.column === "full"
                    ? "Full width"
                    : `${node.placement.column} column`}
                </div>
              </div>
              <SectionPanel node={node} />
            </>
          )}
          {tab === "selection" && !node && !personal && <SectionsOutline />}
        </div>

        {override && (
          <div className="border-t p-2 space-y-1">
            <StylePopover path={override.path} label={override.label}>
              <button
                type="button"
                className="w-full text-[13px] rounded-md border px-2 py-1.5 hover:bg-muted"
              >
                {override.action}
              </button>
            </StylePopover>
            <p className="text-[11px] text-muted-foreground text-center">
              Overrides just this one, on top of the section settings above.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px]",
        active ? "bg-muted font-medium" : "hover:bg-muted/60",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
