"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Drag-to-reorder for a plain vertical list in a form, such as the items of a
 * section in the Content tab.
 *
 * Unlike `ItemSortProvider` there is no paper zoom to undo, so offsets are
 * used as dnd-kit hands them back. Rows pick themselves up through the handle
 * from `useSortableRow`, which keeps clicks and typing elsewhere in the row
 * untouched; the keyboard works too (focus the handle, Space, arrows, Space).
 */
export function SortableList({
  ids,
  onMove,
  children,
}: {
  /** The rows' ids, in their current order. */
  ids: string[];
  /** Called with the dragged row's old and new index. */
  onMove: (from: number, to: number) => void;
  children: React.ReactNode;
}) {
  // A small activation distance keeps a click on the handle from being
  // swallowed as a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from >= 0 && to >= 0) onMove(from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/** Ref setter and style for a row in a `SortableList`, plus handle props. */
export function useSortableRow(id: string) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 10 } : {}),
  };

  return {
    setNodeRef,
    style,
    isDragging,
    handleProps: { ...attributes, ...listeners },
  };
}
