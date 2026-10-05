"use client";

import { EditableText } from "@/components/builder/inline/editable-text";
import { useEditing } from "@/components/builder/inline/editing-context";
import { boxStyle, dim, headingStyle } from "@/lib/schema/css";
import { SectionNode, Theme, spacingOf } from "@/lib/schema/document";
import {
  SectionKey,
  isCustomSectionId,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { effectiveColumn, useDocument } from "@/lib/schema/use-document";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Icon } from "./primitives";
import { SectionProvider, adaptHeadingToFill } from "./section-context";

interface SectionShellProps {
  node: SectionNode;
  theme: Theme;
  /** The section sits on a dark column fill. */
  onFill: boolean;
  /** Renders a dashed placeholder so an emptied section stays editable. */
  isEmpty?: boolean;
  /** Continuation slot: the heading reads "… (cont.)". */
  continued?: boolean;
  children?: React.ReactNode;
}

/**
 * The frame around one section: container box, heading and editor chrome, all
 * driven by `node.style`. Also publishes the section context that the item and
 * field primitives read.
 */
export function SectionShell({
  node,
  theme,
  onFill,
  isEmpty,
  continued,
  children,
}: SectionShellProps) {
  const { editable, activePath, setActivePath } = useEditing();
  const selected =
    activePath === node.id || activePath === `${node.id}.heading`;
  const renameSection = useResumeStore((s) => s.renameSection);
  const doc = useDocument();
  const column = effectiveColumn(doc, node);
  // The share of the content width this section's column gets: under ~45%
  // it is a sidebar, where entries stack rather than spread across a line.
  const share =
    column === "left"
      ? doc.layout.ratio
      : column === "right"
        ? 1 - doc.layout.ratio
        : 1;
  const narrow = doc.layout.columns === 2 && share < 0.45;
  const addItem = useResumeStore((s) => s.addItem);

  const sectionKey: SectionKey | null =
    node.id === "summary" ? null : (node.id as SectionKey);
  const isItemSection =
    sectionKey !== null &&
    (isCustomSectionId(node.id) || node.id !== "summary");

  // A heading that kept the theme defaults must still read correctly on a
  // dark fill — its rule as much as its text.
  const heading = headingStyle(
    adaptHeadingToFill(node.style.heading, theme, onFill),
    theme,
  );

  return (
    <SectionProvider value={{ node, theme, onFill, narrow }}>
      <section
        data-section-id={node.id}
        // An empty section exists only as an "add item" target in the editor.
        data-editor-only={isEmpty ? true : undefined}
        className={cn(
          editable && "relative group/section rounded-[3px]",
          editable &&
            selected &&
            "outline outline-1 outline-sky-400/70 outline-offset-4",
        )}
        style={{
          ...boxStyle(node.style.container),
          // The space below a section is the gap to the next one; scale it
          // with the document's section spacing.
          paddingBottom:
            node.style.container.padding.bottom * spacingOf(theme).section,
        }}
        onClick={
          editable
            ? (e) => {
                // A click on the section box itself is empty space, not
                // content, so it should clear rather than select.
                if (e.target === e.currentTarget) {
                  setActivePath(null);
                  return;
                }
                setActivePath(node.id);
              }
            : undefined
        }
      >
        {editable && node.flow.breakBefore && (
          <div
            data-editor-only
            className="absolute -top-2 left-0 right-0 flex items-center gap-1.5 pointer-events-none select-none"
            contentEditable={false}
          >
            <span className="text-[8px] uppercase tracking-wide text-sky-600 whitespace-nowrap">
              Starts on a new page
            </span>
            <span className="flex-1 border-t border-dashed border-sky-400" />
          </div>
        )}
        <h2
          data-section-heading
          style={heading}
          className={
            node.style.heading.icon || node.style.heading.variant === "bar"
              ? "flex items-center gap-2"
              : undefined
          }
        >
          {node.style.heading.variant === "bar" && (
            <span
              aria-hidden
              className="shrink-0"
              style={{
                width: "0.9em",
                height: 3,
                borderRadius: 2,
                background: onFill ? theme.colors.onFill : theme.colors.accent,
              }}
            />
          )}
          <Icon name={node.style.heading.icon} className="w-4 h-4 shrink-0" />
          <EditableText
            value={node.title}
            onCommit={(name) => {
              if (name) renameSection(node.id, name);
            }}
            placeholder="Section title"
            rich={false}
            path={`${node.id}.heading`}
          />
          {continued && (
            <span style={{ color: dim("currentColor", 60) }}> (cont.)</span>
          )}
        </h2>

        {isEmpty ? (
          editable && isItemSection && sectionKey ? (
            <button
              type="button"
              onClick={() => addItem(sectionKey)}
              className="w-full border border-dashed rounded-md px-3 py-2 text-xs opacity-50 hover:opacity-90 flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add item
            </button>
          ) : (
            <div className="border border-dashed rounded-md px-3 py-2 text-xs opacity-50">
              Empty section
            </div>
          )
        ) : (
          children
        )}
      </section>
    </SectionProvider>
  );
}
