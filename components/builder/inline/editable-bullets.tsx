"use client";

import { useResumeStore } from "@/lib/store/useResumeStore";
import { applyHtmlOverride, resolvePathOverride } from "@/lib/style-overrides";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getBulletIcon } from "../preview/sections/bullets";
import { sanitizeInline, toPlainText } from "@/lib/richtext/runs";
import { useEditing } from "./editing-context";
import { RichText } from "./rich-text";
import { EditableText } from "./editable-text";

interface BulletLineProps {
  value: string;
  autoFocus?: boolean;
  onDone: (text: string, viaEnter: boolean) => void;
  style?: React.CSSProperties;
}

function BulletLine({ value, autoFocus, onDone, style }: BulletLineProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const viaEnter = useRef(false);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder="Bullet point"
      className={cn(
        "editable-field flex-1 cursor-text outline-none rounded-[2px] transition-colors",
        "hover:bg-black/5 focus:bg-black/5 focus:ring-1 focus:ring-sky-400/70",
      )}
      style={style}
      onBlur={() => {
        // A bullet is one line, so inline markup is safe here provided a
        // newline never enters the line's own value.
        const text = sanitizeInline(ref.current?.innerHTML ?? "")
          .replace(/\n+/g, " ")
          .trim();
        const enter = viaEnter.current;
        viaEnter.current = false;
        onDone(text, enter);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          viaEnter.current = true;
          (e.currentTarget as HTMLElement).blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          if (ref.current) ref.current.textContent = toPlainText(value);
          (e.currentTarget as HTMLElement).blur();
        } else if (
          e.key === "Backspace" &&
          (ref.current?.textContent ?? "") === ""
        ) {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }}
    >
      <RichText value={value} />
    </span>
  );
}

interface EditableBulletsProps {
  description: string;
  bulletStyle?: string;
  textColor?: string;
  fontSize: number;
  onCommit: (description: string) => void;
  /** Style-override path for the description field. */
  path?: string;
}

/**
 * Editable version of RenderDescription: each line of the \n-joined
 * description is an editable bullet. Enter adds a bullet below, clearing
 * a line removes it. bulletStyle "none" renders one multiline paragraph.
 */
export function EditableBullets({
  description,
  bulletStyle,
  textColor = "#3e3e3e",
  fontSize,
  onCommit,
  path,
}: EditableBulletsProps) {
  const { editable } = useEditing();
  const overrides = useResumeStore((s) => s.settings.styleOverrides);
  // Index in `lines` where a new (not yet committed) bullet is being typed.
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const lineStyle = applyHtmlOverride(
    { color: textColor, fontSize },
    resolvePathOverride(overrides, path),
  );

  const lines = description
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .map((l) => l.replace(/^[•\-\*•◦▪]\s*/, ""));

  if (!bulletStyle || bulletStyle === "none") {
    return (
      <EditableText
        value={description}
        onCommit={onCommit}
        multiline
        as="p"
        placeholder="Description"
        className="whitespace-pre-line leading-relaxed"
        style={{ color: textColor, fontSize }}
        path={path}
      />
    );
  }

  const commitLine = (index: number, text: string, viaEnter: boolean) => {
    const next = [...lines];
    if (text === "") next.splice(index, 1);
    else next[index] = text;
    if (next.join("\n") !== lines.join("\n")) onCommit(next.join("\n"));
    setPendingIndex(viaEnter && text !== "" ? index + 1 : null);
  };

  const commitPending = (text: string, viaEnter: boolean) => {
    if (text === "") {
      setPendingIndex(null);
      return;
    }
    const next = [...lines];
    next.splice(pendingIndex ?? lines.length, 0, text);
    onCommit(next.join("\n"));
    setPendingIndex(viaEnter ? (pendingIndex ?? lines.length) + 1 : null);
  };

  const rows: React.ReactNode[] = [];
  const renderBullet = (children: React.ReactNode, key: string) => (
    <li
      key={key}
      className="leading-relaxed flex items-start gap-1"
      style={lineStyle}
    >
      <span
        className="shrink-0 w-3 h-[1.625em] flex items-center justify-center opacity-80"
        style={{ color: lineStyle.color }}
      >
        {getBulletIcon(bulletStyle)}
      </span>
      {children}
    </li>
  );

  lines.forEach((line, index) => {
    if (pendingIndex === index) {
      rows.push(
        renderBullet(
          <BulletLine value="" autoFocus onDone={commitPending} />,
          `pending-${index}`,
        ),
      );
    }
    rows.push(
      renderBullet(
        editable ? (
          <BulletLine
            key={`${line}-${index}`}
            value={line}
            onDone={(text, viaEnter) => commitLine(index, text, viaEnter)}
          />
        ) : (
          <span>
            <RichText value={line} />
          </span>
        ),
        `line-${index}`,
      ),
    );
  });
  if (pendingIndex !== null && pendingIndex >= lines.length) {
    rows.push(
      renderBullet(
        <BulletLine value="" autoFocus onDone={commitPending} />,
        "pending-end",
      ),
    );
  }

  return (
    <ul className="space-y-0.5 mt-1">
      {rows}
      {editable && pendingIndex === null && (
        <li>
          <button
            type="button"
            className="flex items-center gap-1 opacity-0 hover:opacity-70 focus:opacity-70 transition-opacity text-[10px] mt-0.5"
            style={{ color: textColor }}
            onClick={() => setPendingIndex(lines.length)}
          >
            <Plus className="w-3 h-3" /> Add point
          </button>
        </li>
      )}
    </ul>
  );
}
