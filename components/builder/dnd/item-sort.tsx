"use client";

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditing } from "@/components/builder/inline/editing-context";
import { SectionKey, useResumeStore } from "@/lib/store/useResumeStore";
import { createContext, useContext, useState } from "react";

/**
 * A press that starts inside the field being edited is a text selection, not
 * a drag. Anywhere else on the item it picks the item up.
 */
class ItemPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent: e }: React.PointerEvent) => {
        if (!e.isPrimary || e.button !== 0) return false;
        const editing = document.activeElement;
        return !(
          editing instanceof HTMLElement &&
          editing.isContentEditable &&
          editing.contains(e.target as Node)
        );
      },
    },
  ];
}

/** Paper zoom, so dnd-kit's screen-pixel offsets land right on the sheet. */
const ScaleContext = createContext(1);

/**
 * Drag-to-reorder for the items of one section fragment.
 *
 * The sheet is drawn under a `scale()` transform while dnd-kit measures in
 * screen pixels, so every offset it hands back is divided by the zoom before
 * it is applied. `ids` are the fragment's items in order; each item carries
 * its index in the section's full list, which is what `reorderItem` takes.
 */
export function ItemSortProvider({
  sectionKey,
  ids,
  children,
}: {
  sectionKey: SectionKey;
  ids: string[];
  children: React.ReactNode;
}) {
  const reorderItem = useResumeStore((s) => s.reorderItem);
  const { setActivePath } = useEditing();
  const [scale, setScale] = useState(1);

  // A small activation distance keeps a click — which starts editing — from
  // being swallowed as a drag.
  const sensors = useSensors(
    useSensor(ItemPointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onDragStart = (e: DragStartEvent) => {
    const el = (
      e.activatorEvent.target as HTMLElement | null
    )?.closest<HTMLElement>("[data-item-id]");
    if (el?.offsetWidth) {
      setScale(el.getBoundingClientRect().width / el.offsetWidth);
    }
    // A press on a field focuses it; release that focus so the drop doesn't
    // leave a caret in the moved item.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // The selection rail would sit over the items making room for the drag.
    setActivePath(null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    // Select what was moved, so its rail is at hand for a nudge or a delete.
    setActivePath(`${sectionKey}.${active.id}`);
    if (!over || active.id === over.id) return;
    const from = active.data.current?.index;
    const to = over.data.current?.index;
    if (typeof from === "number" && typeof to === "number") {
      reorderItem(sectionKey, from, to);
    }
  };

  return (
    <ScaleContext.Provider value={scale}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          {children}
        </SortableContext>
      </DndContext>
    </ScaleContext.Provider>
  );
}

/** Ref, listeners and style for one item inside an `ItemSortProvider`. */
export function useSortableItem(itemId: string, index: number) {
  const scale = useContext(ScaleContext);
  const { setNodeRef, listeners, transform, transition, isDragging } =
    useSortable({ id: itemId, data: { index } });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(
      transform && {
        ...transform,
        x: transform.x / scale,
        y: transform.y / scale,
      },
    ),
    transition,
    ...(isDragging ? { zIndex: 10, opacity: 0.85 } : {}),
  };

  return { ref: setNodeRef, listeners, style, isDragging };
}
