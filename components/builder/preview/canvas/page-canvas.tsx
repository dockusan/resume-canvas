"use client";

import { PersonalShell } from "@/components/builder/preview/sections/personal-shell";
import { PersonalField } from "@/components/builder/preview/sections/personal-field";
import { ContactItem } from "@/components/builder/preview/sections/contact-item";
import { ResumePhoto } from "@/components/builder/preview/sections/resume-photo";
import { PERSONAL_CONTACT_FIELDS } from "@/lib/personal-fields";
import {
  Decoration,
  ColumnId,
  ResumeDocument,
  SectionNode,
  fontSizeAt,
} from "@/lib/schema/document";
import {
  borderStyle,
  fillStyle,
  fontStyle,
  isDarkFill,
  padding,
  separatorStyle,
} from "@/lib/schema/css";
import { sectionsIn } from "@/lib/schema/use-document";
import { SectionDropZone } from "@/components/builder/dnd/section-dnd";
import { Fragment } from "react";

/** Bars pinned to a page or column edge (Classic's strip, Executive's rule). */
function Decorations({
  decorations,
  target,
}: {
  decorations: Decoration[];
  target: Decoration["target"];
}) {
  const mine = decorations.filter((d) => d.target === target);
  if (!mine.length) return null;
  return (
    <>
      {mine.map((d, i) => {
        const horizontal = d.edge === "top" || d.edge === "bottom";
        return (
          <div
            key={`${d.edge}-${i}`}
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              ...fillStyle(d.fill),
              [d.edge]: 0,
              ...(horizontal
                ? { left: 0, right: 0, height: d.size }
                : { top: 0, bottom: 0, width: d.size }),
            }}
          />
        );
      })}
    </>
  );
}

function HeaderPhoto({ doc }: { doc: ResumeDocument }) {
  const { photo } = doc.layout.header;
  if (!photo.visible) return null;
  return (
    <ResumePhoto
      size={Math.round(photo.size * 1.4)}
      photoBorderRadius={
        photo.shape === "circle"
          ? "9999px"
          : photo.shape === "rounded"
            ? `${doc.theme.radius.lg}px`
            : "0px"
      }
      className="shrink-0"
      style={{
        width: photo.size,
        height: photo.size,
        transform: photo.rotate ? `rotate(${photo.rotate}deg)` : undefined,
        boxShadow: photo.shadow || undefined,
        ...borderStyle(photo.border),
      }}
      placeholderClassName="p-4 bg-black/5"
    />
  );
}

function ResumeHeader({ doc }: { doc: ResumeDocument }) {
  const { header } = doc.layout;
  const { theme } = doc;
  const onFill = isDarkFill(header.background);
  const color = onFill ? theme.colors.onFill : theme.colors.text;

  const alignItems =
    header.align === "center"
      ? "center"
      : header.align === "right"
        ? "flex-end"
        : "flex-start";

  const photo =
    header.photo.slot === "header" ? <HeaderPhoto doc={doc} /> : null;

  // "beside" gives the contacts their own column opposite the name, instead
  // of stacking them underneath and leaving the header's other half blank.
  const beside = header.contacts.placement === "beside";

  return (
    <PersonalShell
      data-resume-header
      className="flex gap-5"
      style={{
        ...fillStyle(header.background),
        ...padding(header.padding),
        ...borderStyle(header.border),
        color,
        flexDirection:
          header.direction === "column"
            ? header.photoPosition === "start"
              ? "column"
              : "column-reverse"
            : header.photoPosition === "start"
              ? "row"
              : "row-reverse",
        alignItems:
          header.direction === "column"
            ? alignItems
            : header.align === "center"
              ? "center"
              : "flex-start",
      }}
    >
      {photo}
      <div
        className="flex min-w-0 flex-1 gap-4"
        style={{
          flexDirection: beside ? "row" : "column",
          alignItems: beside ? "flex-start" : alignItems,
          justifyContent: beside ? "space-between" : undefined,
        }}
      >
        <div
          className="flex min-w-0 flex-col"
          style={{ alignItems, textAlign: header.align }}
        >
          <h1
            style={{
              ...fontStyle(theme.fonts.heading),
              fontSize: fontSizeAt(theme, 5),
              color: onFill ? theme.colors.onFill : theme.colors.heading,
              lineHeight: 1.1,
            }}
          >
            <PersonalField name="fullName" />
          </h1>
          <ContactItem
            field="title"
            as="p"
            style={{
              fontSize: fontSizeAt(theme, 1),
              color: onFill ? theme.colors.onFill : theme.colors.accent,
              fontWeight: 500,
              marginTop: 2,
              marginBottom: beside ? 0 : 6,
            }}
          />
        </div>

        <div
          className="flex min-w-0"
          style={{
            flexDirection: header.contacts.direction,
            flexWrap: header.contacts.direction === "row" ? "wrap" : "nowrap",
            gap: header.contacts.gap,
            alignItems:
              header.contacts.align === "start"
                ? "flex-start"
                : header.contacts.align === "end"
                  ? "flex-end"
                  : "center",
            fontSize: fontSizeAt(theme, -1),
            opacity: 0.9,
          }}
        >
          {PERSONAL_CONTACT_FIELDS.filter((f) => f.field !== "title").map(
            ({ field }, i) => (
              <ContactItem
                key={field}
                field={field}
                icon={
                  header.contacts.showIcons ? CONTACT_ICONS[field] : undefined
                }
                iconAfter={header.contacts.iconPosition === "after"}
                className="flex items-center gap-1.5 min-w-0"
                iconClassName="w-3 h-3 shrink-0"
                style={
                  i > 0 && header.contacts.separator.kind !== "none"
                    ? separatorStyle(header.contacts.separator)
                    : undefined
                }
              />
            ),
          )}
        </div>
      </div>
    </PersonalShell>
  );
}

/** Registry names, resolved through the shared document icon renderer. */
const CONTACT_ICONS: Record<string, string> = {
  phone: "Phone",
  email: "Mail",
  location: "MapPin",
  website: "Globe",
  linkedin: "Linkedin",
  github: "Github",
  twitter: "Twitter",
};

/** Clears the selection when the click landed on blank page furniture. */
function clearIfBackground(e: React.MouseEvent, clear: (path: null) => void) {
  if (e.target === e.currentTarget) clear(null);
}

export interface PageCanvasProps {
  doc: ResumeDocument;
  renderSection: (node: SectionNode) => React.ReactNode;
  /** Rendered at the end of a column (the "add section here" affordance). */
  columnFooter?: (column: ColumnId | "full") => React.ReactNode;
  /** Page this canvas is drawing; the header only appears on the first. */
  pageIndex?: number;
  /** Renders drop zones between sections (editor only). */
  dropZones?: boolean;
  /** Called with null when a click lands on empty page furniture. */
  onBackgroundClick?: (path: null) => void;
}

/**
 * One paper page, composed from the document schema. Replaces the six
 * hardcoded HTML layout components.
 */
export function PageCanvas({
  doc,
  renderSection,
  columnFooter,
  pageIndex = 0,
  dropZones,
  onBackgroundClick,
}: PageCanvasProps) {
  const { layout, page, theme } = doc;
  const twoCol = layout.columns === 2;
  const headerInColumn = layout.header.placement !== "band";
  // The header and portrait belong to the first page only.
  const firstPage = pageIndex === 0;

  const column = (id: ColumnId) => {
    const nodes = sectionsIn(doc, twoCol ? id : "full");
    const showHeader = headerInColumn && layout.header.placement === id;
    return (
      <div
        data-column={id}
        onClick={(e) =>
          onBackgroundClick && clearIfBackground(e, onBackgroundClick)
        }
        className="relative flex flex-col min-w-0"
        style={{
          ...fillStyle(layout.fills[id]),
          ...padding(layout.padding[id]),
          color: isDarkFill(layout.fills[id])
            ? theme.colors.onFill
            : theme.colors.text,
        }}
      >
        <Decorations decorations={layout.decorations} target={id} />
        <div
          className="relative flex flex-col flex-1 min-w-0"
          onClick={(e) =>
            onBackgroundClick && clearIfBackground(e, onBackgroundClick)
          }
        >
          {firstPage && layout.header.photo.slot === id && (
            <div
              data-photo-slot
              className="flex mb-4"
              style={{
                justifyContent:
                  layout.header.photo.align === "center"
                    ? "center"
                    : layout.header.photo.align === "end"
                      ? "flex-end"
                      : "flex-start",
              }}
            >
              <HeaderPhoto doc={doc} />
            </div>
          )}
          {firstPage && showHeader && <ResumeHeader doc={doc} />}
          {nodes.map((node, i) => (
            <Fragment key={node.id}>
              {dropZones && (
                <SectionDropZone
                  slot={{
                    column: twoCol ? id : "full",
                    page: pageIndex,
                    index: i,
                  }}
                />
              )}
              {renderSection(node)}
            </Fragment>
          ))}
          {dropZones && (
            <SectionDropZone
              slot={{
                column: twoCol ? id : "full",
                page: pageIndex,
                index: nodes.length,
              }}
            />
          )}
          {columnFooter?.(twoCol ? id : "full")}
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative flex flex-1 min-h-0 flex-col"
      onClick={(e) =>
        onBackgroundClick && clearIfBackground(e, onBackgroundClick)
      }
      style={{ ...fillStyle(page.background), ...padding(page.margin) }}
    >
      <Decorations decorations={layout.decorations} target="page" />
      {firstPage && !headerInColumn && <ResumeHeader doc={doc} />}
      {twoCol ? (
        <div
          className="grid flex-1 min-h-0"
          style={{
            gridTemplateColumns: `${layout.ratio * 100}% ${
              (1 - layout.ratio) * 100 - (layout.gap / 794) * 100
            }%`,
            gap: layout.gap,
          }}
        >
          {column("left")}
          {column("right")}
        </div>
      ) : (
        <div className="flex-1 min-h-0">{column("left")}</div>
      )}
    </div>
  );
}
