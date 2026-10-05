"use client";

import { dim } from "@/lib/schema/css";
import { EditableLink } from "@/components/builder/inline/editable-link";
import { useEditing } from "@/components/builder/inline/editing-context";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Field, Icon, Item, ItemFlow, ItemHeaderRow } from "./primitives";
import {
  isFieldVisible,
  useDateBelow,
  useSection,
  useSectionColors,
} from "./section-context";
import { SectionShell } from "./section-shell";
import { SectionRenderProps, inRange } from "./types";

function Body({ itemRange }: { itemRange?: [number, number] }) {
  const certifications = useResumeStore((s) => s.resumeData.certifications);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { editable } = useEditing();
  const { node } = useSection();
  const colors = useSectionColors();

  const showIssuer = isFieldVisible(node, "issuer");
  const dateBelow = useDateBelow();
  const showLink = isFieldVisible(node, "link");
  const linkIcon = node.fields?.link?.icon ?? "ExternalLink";

  return (
    <ItemFlow>
      {inRange(certifications, itemRange).map(([cert, index]) => {
        const link = showLink && (
          <EditableLink
            url={cert.link || ""}
            onCommit={(v) => updateItem("certifications", cert.id, { link: v })}
            className="underline hover:opacity-100 opacity-80 inline-block ml-1"
          >
            <Icon name={linkIcon} className="w-3 h-3 inline" />
          </EditableLink>
        );

        const description = (
          <Field
            name="description"
            as="p"
            multiline
            className="mt-1"
            style={{ color: dim(colors.text, 70) }}
            value={cert.description || ""}
            onCommit={(v) =>
              updateItem("certifications", cert.id, { description: v })
            }
            placeholder="Description (optional)"
            path={`certifications.${cert.id}.description`}
          />
        );

        return (
          <Item
            key={cert.id}
            sectionKey="certifications"
            itemId={cert.id}
            index={index}
            count={certifications.length}
          >
            <ItemHeaderRow className="mb-0.5">
              <Field
                name="name"
                as="h3"
                className="font-medium"
                style={{ color: colors.text }}
                value={cert.name}
                onCommit={(v) =>
                  updateItem("certifications", cert.id, { name: v })
                }
                placeholder="Certification"
                path={`certifications.${cert.id}.name`}
              />
              {!dateBelow && (
                <Field
                  name="date"
                  as={dateBelow ? "div" : "span"}
                  className={
                    dateBelow
                      ? "font-medium"
                      : "font-medium whitespace-nowrap ml-2"
                  }
                  style={{ color: dim(colors.text, 80) }}
                  value={cert.date || ""}
                  onCommit={(v) =>
                    updateItem("certifications", cert.id, { date: v })
                  }
                  placeholder="Date"
                  path={`certifications.${cert.id}.date`}
                />
              )}
            </ItemHeaderRow>

            {(showIssuer || showLink) && (
              <p style={{ color: dim(colors.text, 80) }}>
                <Field
                  name="issuer"
                  value={cert.issuer}
                  onCommit={(v) =>
                    updateItem("certifications", cert.id, { issuer: v })
                  }
                  placeholder="Issuer"
                  path={`certifications.${cert.id}.issuer`}
                />
                {/* Without a URL the icon is just an affordance to add one. */}
                {cert.link
                  ? link
                  : editable && <span data-editor-only>{link}</span>}
              </p>
            )}
            {dateBelow && (
              <Field
                name="date"
                as={dateBelow ? "div" : "span"}
                className={
                  dateBelow
                    ? "font-medium"
                    : "font-medium whitespace-nowrap ml-2"
                }
                style={{ color: dim(colors.text, 80) }}
                value={cert.date || ""}
                onCommit={(v) =>
                  updateItem("certifications", cert.id, { date: v })
                }
                placeholder="Date"
                path={`certifications.${cert.id}.date`}
              />
            )}

            {cert.description ? (
              description
            ) : editable ? (
              <div data-editor-only>{description}</div>
            ) : null}
          </Item>
        );
      })}
    </ItemFlow>
  );
}

export function CertificationsSection({
  node,
  theme,
  onFill,
  itemRange,
  continued,
}: SectionRenderProps) {
  const count = useResumeStore((s) => s.resumeData.certifications.length);
  return (
    <SectionShell
      node={node}
      theme={theme}
      onFill={onFill}
      continued={continued}
      isEmpty={count === 0}
    >
      <Body itemRange={itemRange} />
    </SectionShell>
  );
}
