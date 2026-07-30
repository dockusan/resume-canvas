"use client";

import { useResumeStore } from "@/lib/store/useResumeStore";
import { applyHtmlOverride, resolvePathOverride } from "@/lib/style-overrides";
import { sanitizeInline, toPlainText } from "@/lib/richtext/runs";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useEditing } from "./editing-context";
import { RichText } from "./rich-text";

interface EditableTextProps {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  /** Multiline: Enter inserts a newline, Cmd/Ctrl+Enter commits. */
  multiline?: boolean;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  /** Style-override path reported to the style toolbar on focus. */
  path?: string;
  /**
   * Allow inline formatting (bold / italic / underline / links) via the
   * selection toolbar. Off for values that must stay literal, like dates.
   */
  rich?: boolean;
}

/**
 * Click-to-edit text. Uncontrolled contentEditable: the store is only
 * written on commit (blur/Enter), so React never re-renders the node
 * mid-edit; external changes (undo/redo) remount it via key={value}.
 */
export function EditableText({
  value,
  onCommit,
  placeholder,
  multiline,
  as: Tag = "span",
  className,
  style,
  path,
  rich = true,
}: EditableTextProps) {
  const { editable, setActivePath } = useEditing();
  const overrides = useResumeStore((s) => s.settings.styleOverrides);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  const mergedStyle = applyHtmlOverride(
    style,
    resolvePathOverride(overrides, path),
  );

  if (!editable) {
    return (
      <Tag className={className} style={mergedStyle}>
        {rich ? <RichText value={value} /> : toPlainText(value)}
      </Tag>
    );
  }

  const commit = () => {
    const el = ref.current as HTMLElement | null;
    if (!el) return;
    if (rich) {
      // Round-tripping through the run parser strips anything the browser
      // produced that is not on the allowlist.
      const next = sanitizeInline(el.innerHTML).trim();
      if (next !== value) onCommit(next);
      return;
    }
    const raw = (multiline ? el.innerText : el.textContent) ?? "";
    const text = raw.replace(/ /g, " ").replace(/\n+$/, "").trim();
    if (text !== value) onCommit(text);
  };

  return (
    <Tag
      key={value}
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      className={cn(
        "editable-field cursor-text outline-none rounded-[2px] transition-colors",
        "hover:bg-black/5 focus:bg-black/5 focus:ring-1 focus:ring-sky-400/70",
        className,
      )}
      style={mergedStyle}
      onFocus={(e: React.FocusEvent<HTMLElement>) => {
        if (path) setActivePath(path, e.currentTarget);
      }}
      onBlur={commit}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter") {
          if (!multiline || e.metaKey || e.ctrlKey) {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          const el = ref.current as HTMLElement | null;
          if (el) el.textContent = toPlainText(value);
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onPaste={(e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }}
      onClick={(e: React.MouseEvent) => {
        // Don't follow links / trigger parent anchors while editing.
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {rich ? <RichText value={value} /> : value}
    </Tag>
  );
}
