"use client";

import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FONT_SIZE_STEPS,
  normalizeUrl,
  stepForSize,
} from "@/lib/richtext/runs";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Link2,
  Link2Off,
  Minus,
  Plus,
  Underline,
} from "lucide-react";
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
/** Ladder position of an explicit font-size on or above the selection. */
function explicitSizeStep(range: Range, field: Element): number {
  let node: Node | null = range.commonAncestorContainer;
  while (node && node !== field) {
    if (node instanceof HTMLElement) {
      const em = node.style.fontSize.match(/^([\d.]+)em$/);
      if (em) return stepForSize(parseFloat(em[1]));
    }
    node = node.parentNode;
  }
  return 4;
}

export function SelectionToolbar() {
  const [rect, setRect] = useState<Rect | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  /** 1–7 ladder position of the selection, as execCommand reports it. */
  const [sizeStep, setSizeStep] = useState(4);
  const [draft, setDraft] = useState("");
  const savedRange = useRef<Range | null>(null);
  const [color, setColor] = useState("#000000");
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
    // queryCommandValue maps against a 16px baseline, so unstyled resume text
    // reports as "small". Read the explicit mark instead: no span means the
    // text is at the field's own size, which is 100%.
    setSizeStep(explicitSizeStep(range, field));
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
    // Bold/italic/underline are cleaner as tags; size and colour have no tag
    // equivalent worth keeping, so those are emitted as inline styles and
    // normalised by the run parser on commit.
    const asCss = command === "foreColor" || command === "fontSize";
    document.execCommand("styleWithCSS", false, asCss ? "true" : "false");
    document.execCommand(command, false, value);
  };

  const setSize = (step: number) => {
    setSizeStep(step);
    // execCommand's 1–7 ladder emits keyword sizes tied to a 16px baseline;
    // apply the em multiplier directly so the text stays relative to its field.
    applyInlineStyle("font-size", `${FONT_SIZE_STEPS[step - 1]}em`);
  };

  /**
   * Wrap the selection in a span carrying one declaration. execCommand has no
   * command for relative sizing, and its `fontSize` writes absolute keywords.
   */
  const applyInlineStyle = (property: string, value: string) => {
    restore();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    const span = document.createElement("span");
    span.style.setProperty(property, value);
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      // Keep the text selected so the next click continues to apply.
      const next = document.createRange();
      next.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(next);
      savedRange.current = next.cloneRange();
    } catch {
      // Selections spanning partial elements can refuse extraction; leaving
      // the text untouched is better than corrupting it.
    }
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

      <span className="mx-0.5 h-4 w-px bg-border" />

      <Btn title="Smaller" onClick={() => setSize(Math.max(1, sizeStep - 1))}>
        <Minus className="w-3.5 h-3.5" />
      </Btn>
      <span
        className="min-w-9 text-center text-[10px] tabular-nums text-muted-foreground"
        title="Size relative to the field"
      >
        {Math.round(FONT_SIZE_STEPS[sizeStep - 1] * 100)}%
      </span>
      <Btn title="Larger" onClick={() => setSize(Math.min(7, sizeStep + 1))}>
        <Plus className="w-3.5 h-3.5" />
      </Btn>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Text colour"
            className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center"
            onMouseDown={(e) => e.preventDefault()}
          >
            <span
              className="h-3.5 w-3.5 rounded-full border"
              style={{ background: color }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ColorPicker
            value={color}
            onChange={(next) => {
              setColor(next);
              applyInlineStyle("color", next);
            }}
          />
        </PopoverContent>
      </Popover>

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
