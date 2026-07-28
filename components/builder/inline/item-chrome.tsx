"use client";

import { SectionKey, useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useEditing } from "./editing-context";
import { StylePopover } from "./style-toolbar";

interface ItemChromeProps {
  sectionKey: SectionKey;
  itemId: string;
  index: number;
  count: number;
  /** Compact: only a corner delete button (for tiny items like skill badges). */
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

function Btn({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string;
  onClick?: () => void;
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
        "p-0.5 rounded text-gray-500 disabled:opacity-30",
        danger
          ? "hover:bg-red-50 hover:text-red-600"
          : "hover:bg-gray-100 hover:text-gray-800",
      )}
    >
      {children}
    </button>
  );
}

/** Hover action bar for one item: add-below / reorder / duplicate / style / delete. */
export function ItemChrome({
  sectionKey,
  itemId,
  index,
  count,
  compact,
  className,
  style,
  children,
}: ItemChromeProps) {
  const { editable } = useEditing();
  const addItem = useResumeStore((s) => s.addItem);
  const duplicateItem = useResumeStore((s) => s.duplicateItem);
  const removeItem = useResumeStore((s) => s.removeItem);
  const reorderItem = useResumeStore((s) => s.reorderItem);

  if (!editable) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("relative group/item", className)} style={style}>
        {children}
        <button
          type="button"
          title="Remove"
          onClick={() => removeItem(sectionKey, itemId)}
          className="absolute -top-1.5 -right-1.5 z-10 hidden group-hover/item:flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-300"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative group/item", className)} style={style}>
      {children}
      <div
        className="absolute -top-2.5 right-0 z-10 flex items-center bg-white border border-gray-200 rounded-md shadow-sm p-1 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity gap-1"
        contentEditable={false}
      >
        <Btn
          title="Add item below"
          onClick={() => {
            addItem(sectionKey);
            // New item is appended at the end; move it just below this one.
            reorderItem(sectionKey, count, index + 1);
          }}
        >
          <Plus className="w-4 h-4" />
        </Btn>
        <Btn
          title="Duplicate item"
          onClick={() => duplicateItem(sectionKey, itemId)}
        >
          <Copy className="w-4 h-4" />
        </Btn>
        <Btn
          title="Move up"
          disabled={index === 0}
          onClick={() => reorderItem(sectionKey, index, index - 1)}
        >
          <ArrowUp className="w-4 h-4" />
        </Btn>
        <Btn
          title="Move down"
          disabled={index === count - 1}
          onClick={() => reorderItem(sectionKey, index, index + 1)}
        >
          <ArrowDown className="w-4 h-4" />
        </Btn>
        <StylePopover path={`${sectionKey}.${itemId}`} label="Item styling">
          <button
            type="button"
            title="Item styling"
            className="p-0.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <Settings className="w-4 h-4" />
          </button>
        </StylePopover>
        <Btn
          title="Delete item"
          danger
          onClick={() => removeItem(sectionKey, itemId)}
        >
          <Trash2 className="w-4 h-4" />
        </Btn>
      </div>
    </div>
  );
}
