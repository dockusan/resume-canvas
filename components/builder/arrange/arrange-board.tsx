"use client";

import {
  SectionDragHandle,
  SectionDropZone,
} from "@/components/builder/dnd/section-dnd";
import { ColumnKey } from "@/lib/pagination/distribute";
import { SectionNode } from "@/lib/schema/document";
import { effectiveColumn, useDocument } from "@/lib/schema/use-document";
import {
  DEFAULT_SECTION_NAMES,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  GripVertical,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

/**
 * The whole resume as a list of section cards.
 *
 * Rearranging on the page means dragging a small handle around a document that
 * may span several pages; here the entire structure is visible at once and the
 * cards are large enough to drag on a phone. Both surfaces write through the
 * same `moveSectionTo`, so the two can never disagree.
 */
export function ArrangeBoard() {
  const doc = useDocument();
  const settings = useResumeStore((s) => s.settings);
  const restoreSection = useResumeStore((s) => s.restoreSection);
  const addCustomSection = useResumeStore((s) => s.addCustomSection);
  const twoCol = doc.layout.columns === 2;

  const all = [...settings.leftColumn, ...settings.rightColumn];
  const removed = Object.keys(DEFAULT_SECTION_NAMES).filter(
    (id) => !all.some((s) => s.id === id),
  );

  const columns: ColumnKey[] = twoCol ? ["left", "right"] : ["full"];

  return (
    <div className="mx-auto w-full max-w-4xl p-3 sm:p-6">
      <p className="mb-3 text-xs text-muted-foreground">
        Drag a card, or use the arrows, to reorder sections
        {twoCol ? " and move them between columns" : ""}. Hidden sections stay
        in your data but do not print.
      </p>

      <div
        className={cn(
          "grid gap-3",
          twoCol ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {columns.map((column) => {
          const nodes = doc.sections
            .filter((n) => effectiveColumn(doc, n) === column)
            .sort((a, b) => a.placement.order - b.placement.order);
          return (
            <div key={column} className="rounded-lg border bg-muted/30 p-2">
              {twoCol && (
                <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {column === "left" ? "Left column" : "Right column"}
                </div>
              )}
              <div className="space-y-2">
                {nodes.map((node, index) => (
                  <div key={node.id}>
                    <SectionDropZone slot={{ column, page: 0, index }} />
                    <SectionCard
                      node={node}
                      index={index}
                      count={nodes.length}
                    />
                  </div>
                ))}
                <SectionDropZone
                  slot={{ column, page: 0, index: nodes.length }}
                />
                {nodes.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Nothing here yet
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => addCustomSection()}
          className="flex items-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-xs hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" /> Add a section
        </button>
        {removed.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => restoreSection(id)}
            className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs hover:bg-muted"
          >
            <RotateCcw className="h-3 w-3 text-muted-foreground" />
            Restore {DEFAULT_SECTION_NAMES[id]}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  node,
  index,
  count,
}: {
  node: SectionNode;
  index: number;
  count: number;
}) {
  const doc = useDocument();
  const moveSection = useResumeStore((s) => s.moveSection);
  const toggleVisibility = useResumeStore((s) => s.toggleSectionVisibility);
  const removeSection = useResumeStore((s) => s.removeSectionFromLayout);
  const twoCol = doc.layout.columns === 2;
  const column = effectiveColumn(doc, node);

  return (
    <div
      className={cn(
        "rounded-md border bg-card px-2 py-2",
        !node.visible && "opacity-55",
      )}
    >
      <div className="flex items-center gap-1">
        <SectionDragHandle sectionId={node.id}>
          <span
            title="Drag to move"
            className="flex h-8 w-6 cursor-grab items-center justify-center text-muted-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        </SectionDragHandle>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {node.title}
        </span>
        <Switch
          checked={node.visible}
          onCheckedChange={() => toggleVisibility(node.id)}
          aria-label={
            node.visible ? `Hide ${node.title}` : `Show ${node.title}`
          }
          className="shrink-0"
        />
      </div>
      <div className="mt-1 flex items-center gap-0.5 pl-6">
        <IconBtn
          title="Move up"
          disabled={index === 0}
          onClick={() => moveSection(node.id, "up")}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          title="Move down"
          disabled={index === count - 1}
          onClick={() => moveSection(node.id, "down")}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </IconBtn>
        {twoCol && (
          <>
            <IconBtn
              title="Move to the left column"
              disabled={column === "left"}
              onClick={() => moveSection(node.id, "left")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </IconBtn>
            <IconBtn
              title="Move to the right column"
              disabled={column === "right"}
              onClick={() => moveSection(node.id, "right")}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </IconBtn>
          </>
        )}
        <IconBtn
          title="Remove from the resume"
          danger
          onClick={() => removeSection(node.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-muted-foreground disabled:opacity-25",
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
