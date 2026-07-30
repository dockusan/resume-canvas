"use client";

import { SectionDragHandle } from "@/components/builder/dnd/section-dnd";
import { useDocument } from "@/lib/schema/use-document";
import { SectionKey, useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  Copy,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useEditing } from "./editing-context";

/** Clearance between the bar and the thing it belongs to. */
const RAIL_OFFSET = 10;
const RAIL_HEIGHT = 30;

interface Anchor {
  top: number;
  left: number;
  /** Bar sits under the selection when there is no room above it. */
  below: boolean;
}

/**
 * Actions for the current selection, parked in the margin beside the page.
 *
 * Previously these toolbars floated over the top-right corner of the element
 * they controlled, which covered the first line of an item — the date sat
 * underneath — and swallowed clicks meant for the text. Living outside the
 * paper, the rail can never occlude content, and it keeps editor chrome out
 * of the measured tree so it cannot influence pagination either.
 *
 * The split of responsibility is deliberate: the rail is *structure* (where a
 * thing sits, whether it exists), the inspector is *appearance*.
 */
export function SelectionRail() {
  const { editable, activePath } = useEditing();
  const doc = useDocument();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(0);

  const target = resolveTarget(
    activePath,
    doc.sections.map((s) => s.id),
  );

  const measure = useCallback(() => {
    if (!target) {
      setAnchor(null);
      return;
    }
    const el = findElement(target);
    const paper = document.querySelector<HTMLElement>("[data-page]");
    if (!el || !paper) {
      setAnchor(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const scroller = paper.closest<HTMLElement>(".overflow-auto");
    const bounds = scroller?.getBoundingClientRect();
    const top = rect.top - RAIL_OFFSET - RAIL_HEIGHT;
    // Fall below the selection when the bar would leave the scroll area.
    const below = bounds ? top < bounds.top + 4 : top < 4;
    setAnchor({
      top: below ? rect.bottom + RAIL_OFFSET : top,
      // Right-aligned to the selection: the left edge is where the text
      // starts, so overlapping there would hide the most content.
      left: rect.right,
      below,
    });
  }, [target]);

  // Measure after layout has settled rather than inside the effect body, so
  // the rail never positions itself against a stale rect.
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [measure, activePath]);

  // Track the bar's own width so it can be clamped against the viewport.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const update = () => setBarWidth(el.offsetWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, anchor?.top]);

  useEffect(() => {
    if (!target) return;
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    const el = findElement(target);
    if (el) observer.observe(el);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [target, measure]);

  const label =
    target?.kind === "section"
      ? (doc.sections.find((s) => s.id === target.sectionId)?.title ??
        "Section")
      : "Item";

  if (!editable || !target || !anchor) return null;

  // The bar is right-aligned to the selection, but on a narrow screen that can
  // put it off the left edge — clamp it into the viewport either way.
  const left = Math.min(
    Math.max(anchor.left, barWidth + 8),
    window.innerWidth - 8,
  );

  return (
    <div
      data-editor-only
      data-keeps-selection
      contentEditable={false}
      ref={barRef}
      className="fixed z-40 flex max-w-[calc(100vw-16px)] items-center gap-0.5 overflow-x-auto rounded-md border bg-card px-1 py-1 shadow-lg -translate-x-full"
      style={{ top: Math.max(8, anchor.top), left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <span className="px-1.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap max-w-28 truncate">
        {label}
      </span>
      <span className="mx-0.5 h-4 w-px bg-border" />
      {target.kind === "section" ? (
        <SectionActions sectionId={target.sectionId} />
      ) : (
        <ItemActions
          sectionKey={target.sectionId as SectionKey}
          itemId={target.itemId}
        />
      )}
    </div>
  );
}

function RailButton({
  title,
  onClick,
  danger,
  active,
  disabled,
  children,
}: {
  title: string;
  onClick?: () => void;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-6 w-6 rounded flex items-center justify-center disabled:opacity-30",
        active
          ? "bg-sky-50 text-sky-600"
          : danger
            ? "text-muted-foreground hover:bg-red-50 hover:text-red-600"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SectionActions({ sectionId }: { sectionId: string }) {
  const doc = useDocument();
  const node = doc.sections.find((s) => s.id === sectionId);
  const moveSection = useResumeStore((s) => s.moveSection);
  const moveSectionTo = useResumeStore((s) => s.moveSectionTo);
  const togglePageBreak = useResumeStore((s) => s.toggleSectionPageBreak);
  const toggleVisibility = useResumeStore((s) => s.toggleSectionVisibility);
  const duplicateSection = useResumeStore((s) => s.duplicateSection);
  const removeSection = useResumeStore((s) => s.removeSectionFromLayout);
  const twoCol = doc.layout.columns === 2;
  if (!node) return null;
  const pinned =
    node.placement.page !== "auto" ? (node.placement.page as number) : null;

  return (
    <>
      <SectionDragHandle sectionId={sectionId}>
        <span
          title="Drag to another column or page"
          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
      </SectionDragHandle>
      <RailButton title="Move up" onClick={() => moveSection(sectionId, "up")}>
        <ArrowUp className="w-3.5 h-3.5" />
      </RailButton>
      <RailButton
        title="Move down"
        onClick={() => moveSection(sectionId, "down")}
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </RailButton>
      {twoCol && (
        <>
          <RailButton
            title="Move to the left column"
            onClick={() => moveSection(sectionId, "left")}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </RailButton>
          <RailButton
            title="Move to the right column"
            onClick={() => moveSection(sectionId, "right")}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </RailButton>
        </>
      )}
      <RailButton
        title="Move to the previous page"
        onClick={() =>
          moveSectionTo(sectionId, {
            page: pinned === null || pinned <= 1 ? "auto" : pinned - 1,
          })
        }
      >
        <ChevronsUp className="w-3.5 h-3.5" />
      </RailButton>
      <RailButton
        title="Move to the next page"
        onClick={() =>
          moveSectionTo(sectionId, { page: pinned === null ? 1 : pinned + 1 })
        }
      >
        <ChevronsDown className="w-3.5 h-3.5" />
      </RailButton>
      <RailButton
        title={
          node.flow.breakBefore
            ? "Don't force a new page"
            : "Start on a new page"
        }
        active={node.flow.breakBefore}
        onClick={() => togglePageBreak(sectionId)}
      >
        <ArrowDownToLine className="w-3.5 h-3.5" />
      </RailButton>
      <span className="mx-0.5 h-4 w-px bg-border" />
      <RailButton
        title="Hide section"
        onClick={() => toggleVisibility(sectionId)}
      >
        <EyeOff className="w-3.5 h-3.5" />
      </RailButton>
      <RailButton
        title="Duplicate section"
        onClick={() => duplicateSection(sectionId)}
      >
        <Copy className="w-3.5 h-3.5" />
      </RailButton>
      <RailButton
        title="Remove section"
        danger
        onClick={() => removeSection(sectionId)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </RailButton>
    </>
  );
}

function ItemActions({
  sectionKey,
  itemId,
}: {
  sectionKey: SectionKey;
  itemId: string;
}) {
  const addItem = useResumeStore((s) => s.addItem);
  const duplicateItem = useResumeStore((s) => s.duplicateItem);
  const removeItem = useResumeStore((s) => s.removeItem);
  const reorderItem = useResumeStore((s) => s.reorderItem);
  const { setActivePath } = useEditing();

  const index = Number(
    findElement({ kind: "item", sectionId: sectionKey, itemId })?.dataset
      .itemIndex ?? -1,
  );
  const count = document.querySelectorAll(
    `[data-page] [data-section-id="${cssEscape(sectionKey)}"] [data-item-index]`,
  ).length;

  return (
    <>
      <RailButton
        title="Add item below"
        onClick={() => {
          addItem(sectionKey);
          if (index >= 0) reorderItem(sectionKey, count, index + 1);
        }}
      >
        <Plus className="w-3.5 h-3.5" />
      </RailButton>
      <RailButton
        title="Duplicate item"
        onClick={() => duplicateItem(sectionKey, itemId)}
      >
        <Copy className="w-3.5 h-3.5" />
      </RailButton>
      <RailButton
        title="Move up"
        disabled={index <= 0}
        onClick={() => reorderItem(sectionKey, index, index - 1)}
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </RailButton>
      <RailButton
        title="Move down"
        disabled={index < 0 || index >= count - 1}
        onClick={() => reorderItem(sectionKey, index, index + 1)}
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </RailButton>
      <span className="mx-0.5 h-4 w-px bg-border" />
      <RailButton
        title="Delete item"
        danger
        onClick={() => {
          removeItem(sectionKey, itemId);
          setActivePath(sectionKey);
        }}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </RailButton>
    </>
  );
}

type Target =
  | { kind: "section"; sectionId: string }
  | { kind: "item"; sectionId: string; itemId: string };

/**
 * Section ids may contain dots (`custom:<uuid>` does not, but be defensive),
 * so resolve against the known ids rather than splitting blindly.
 */
function resolveTarget(
  activePath: string | null,
  sectionIds: string[],
): Target | null {
  if (!activePath) return null;
  const sectionId = sectionIds.find(
    (id) => activePath === id || activePath.startsWith(`${id}.`),
  );
  if (!sectionId) return null;
  const rest = activePath.slice(sectionId.length).replace(/^\./, "");
  if (!rest || rest === "heading") return { kind: "section", sectionId };
  const itemId = rest.split(".")[0];
  return { kind: "item", sectionId, itemId };
}

const cssEscape = (value: string) =>
  typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value;

/** Always resolve against a rendered page, never the hidden measure layer. */
function findElement(target: Target): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const section = `[data-page] [data-section-id="${cssEscape(target.sectionId)}"]`;
  if (target.kind === "section") {
    return document.querySelector<HTMLElement>(section);
  }
  return document.querySelector<HTMLElement>(
    `${section} [data-item-id="${cssEscape(target.itemId)}"]`,
  );
}
