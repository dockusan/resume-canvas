"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { ColumnKey } from "@/lib/pagination/distribute";
import { useDocument } from "@/lib/schema/use-document";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { createContext, useContext, useState } from "react";

/** Identifies a gap between two sections in one column on one page. */
export interface DropSlot {
  column: ColumnKey;
  page: number;
  /** Insert position within the column's visible order. */
  index: number;
}

export const slotId = (s: DropSlot) => `slot:${s.page}:${s.column}:${s.index}`;

interface DndState {
  dragging: string | null;
  /** True while a drag is in flight, so drop zones can reveal themselves. */
  active: boolean;
}

const SectionDndContext = createContext<DndState>({
  dragging: null,
  active: false,
});

export const useSectionDnd = () => useContext(SectionDndContext);

/**
 * Drag-and-drop for whole sections.
 *
 * Drop targets are (page, column, index) triples, so moving a section to the
 * other column and moving it to another page are the same gesture. Dropping on
 * a different page pins the section there; dropping within the same page
 * leaves it flowing.
 */
export function SectionDndProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const doc = useDocument();
  const moveSectionTo = useResumeStore((s) => s.moveSectionTo);
  const [dragging, setDragging] = useState<string | null>(null);

  // A small activation distance keeps a click on the drag handle from being
  // swallowed as a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const onDragStart = (e: DragStartEvent) =>
    setDragging(String(e.active.id).replace(/^section:/, ""));

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const overId = e.over?.id as UniqueIdentifier | undefined;
    if (!overId) return;
    const parsed = parseSlot(String(overId));
    if (!parsed) return;

    const sectionId = String(e.active.id).replace(/^section:/, "");
    const node = doc.sections.find((s) => s.id === sectionId);
    if (!node) return;

    moveSectionTo(sectionId, {
      column: parsed.column === "full" ? "full" : parsed.column,
      index: parsed.index,
      // Only pin when the section lands on a page it would not have flowed to
      // on its own; otherwise leave it free to reflow as content changes.
      page: parsed.page === 0 ? "auto" : parsed.page,
    });
  };

  const title = dragging
    ? doc.sections.find((s) => s.id === dragging)?.title
    : null;

  return (
    <SectionDndContext.Provider value={{ dragging, active: dragging !== null }}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        modifiers={[restrictToWindowEdges]}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {title && (
            <div className="rounded-md border bg-card px-3 py-1.5 text-xs shadow-lg">
              {title}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </SectionDndContext.Provider>
  );
}

function parseSlot(id: string): DropSlot | null {
  const m = id.match(/^slot:(\d+):(left|right|full):(\d+)$/);
  if (!m) return null;
  return {
    page: Number(m[1]),
    column: m[2] as ColumnKey,
    index: Number(m[3]),
  };
}

/** The grab handle shown in a section's toolbar. */
export function SectionDragHandle({
  sectionId,
  children,
}: {
  sectionId: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `section:${sectionId}`,
  });
  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("cursor-grab touch-none", isDragging && "opacity-40")}
    >
      {children}
    </span>
  );
}

/** A thin drop zone rendered between sections while a drag is in flight. */
export function SectionDropZone({ slot }: { slot: DropSlot }) {
  const { active } = useSectionDnd();
  const { setNodeRef, isOver } = useDroppable({ id: slotId(slot) });

  if (!active) return null;
  return (
    <div
      ref={setNodeRef}
      data-editor-only
      className={cn(
        "relative -my-1 h-2 rounded transition-colors",
        isOver ? "bg-sky-500" : "bg-sky-500/15",
      )}
    />
  );
}
