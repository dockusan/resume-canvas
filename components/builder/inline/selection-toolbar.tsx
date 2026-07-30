"use client";

import { Input } from "@/components/ui/input";
import { normalizeUrl } from "@/lib/richtext/runs";
import { cn } from "@/lib/utils";
import { Bold, Italic, Link2, Link2Off, Underline } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Rect {
  top: number;
  left: number;
  width: number;
}

/**
 * Format bar that appears over a text selection inside an editable field.
 *
 * Uses `execCommand` rather than hand-rolled Range surgery: it is the only
 * thing that reliably splits and merges inline formatting across arbitrary
 * selections in `contentEditable`, and the run parser normalises whatever
 * markup it happens to emit.
 */
export function SelectionToolbar() {
  const [rect, setRect] = useState<Rect | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const savedRange = useRef<Range | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const update = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (!linkOpen) setRect(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const host =
      range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
    const field = host?.closest?.(".editable-field[contenteditable='true']");
    if (!field) {
      if (!linkOpen) setRect(null);
      return;
    }
    const box = range.getBoundingClientRect();
    if (!box.width && !box.height) return;
    savedRange.current = range.cloneRange();
    setRect({ top: box.top, left: box.left, width: box.width });
  }, [linkOpen]);

  useEffect(() => {
    document.addEventListener("selectionchange", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const restore = () => {
    const range = savedRange.current;
    if (!range) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const exec = (command: string, value?: string) => {
    restore();
    // Emit tags rather than inline styles so stored markup stays minimal.
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, value);
  };

  if (!rect) return null;

  return (
    <div
      ref={barRef}
      data-editor-only
      data-keeps-selection
      contentEditable={false}
      className={cn(
        "fixed z-50 flex items-center gap-0.5 rounded-md border bg-card p-1 shadow-lg",
      )}
      style={{
        top: Math.max(8, rect.top - 42),
        left: Math.max(8, rect.left + rect.width / 2 - 80),
      }}
      // Keep the selection alive when the bar is clicked.
      onMouseDown={(e) => e.preventDefault()}
    >
      <Btn title="Bold" onClick={() => exec("bold")}>
        <Bold className="w-3.5 h-3.5" />
      </Btn>
      <Btn title="Italic" onClick={() => exec("italic")}>
        <Italic className="w-3.5 h-3.5" />
      </Btn>
      <Btn title="Underline" onClick={() => exec("underline")}>
        <Underline className="w-3.5 h-3.5" />
      </Btn>
      <Btn
        title="Add link"
        onClick={() => {
          setDraft("");
          setLinkOpen((v) => !v);
        }}
      >
        <Link2 className="w-3.5 h-3.5" />
      </Btn>
      <Btn title="Remove link" onClick={() => exec("unlink")}>
        <Link2Off className="w-3.5 h-3.5" />
      </Btn>

      {linkOpen && (
        <form
          className="flex items-center gap-1 pl-1"
          onSubmit={(e) => {
            e.preventDefault();
            const url = normalizeUrl(draft);
            if (url) exec("createLink", url);
            setLinkOpen(false);
            setDraft("");
          }}
        >
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="example.com"
            className="h-6 w-40 text-xs"
            onMouseDown={(e) => e.stopPropagation()}
          />
        </form>
      )}
    </div>
  );
}

function Btn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center"
    >
      {children}
    </button>
  );
}
