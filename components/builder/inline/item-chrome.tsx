"use client";

import { SectionKey } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { useEditing } from "./editing-context";

interface ItemChromeProps {
  sectionKey: SectionKey;
  itemId: string;
  index: number;
  count: number;
  /** Compact items (skill chips) get no extra affordances of their own. */
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Selection wrapper for one item.
 *
 * The item's actions live in the gutter rail rather than floating over the
 * item itself: an overlaid toolbar covered the first line — the date sits
 * there — and intercepted clicks aimed at those fields. All this does now is
 * mark the item and register the selection.
 */
export function ItemChrome({
  sectionKey,
  itemId,
  index,
  compact,
  className,
  style,
  children,
}: ItemChromeProps) {
  const { editable, activePath, setActivePath } = useEditing();

  if (!editable) {
    return (
      <div
        data-item-index={index}
        data-item-id={itemId}
        className={className}
        style={style}
      >
        {children}
      </div>
    );
  }

  const selected =
    activePath === `${sectionKey}.${itemId}` ||
    !!activePath?.startsWith(`${sectionKey}.${itemId}.`);

  return (
    <div
      data-item-index={index}
      data-item-id={itemId}
      className={cn(
        "relative group/item rounded-[3px]",
        // A selected item is outlined rather than covered, so nothing
        // underneath becomes unclickable.
        selected && "outline outline-1 outline-sky-400/60 outline-offset-2",
        !compact && "hover:outline hover:outline-1 hover:outline-sky-300/40",
        className,
      )}
      style={style}
      onClick={(e) => {
        // The item box spans the column, so a click to the right of the text
        // is empty space; let it fall through to the section instead.
        if (e.target === e.currentTarget) return;
        e.stopPropagation();
        setActivePath(`${sectionKey}.${itemId}`);
      }}
    >
      {children}
    </div>
  );
}
