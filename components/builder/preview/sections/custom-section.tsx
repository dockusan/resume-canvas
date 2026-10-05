"use client";

import { dim } from "@/lib/schema/css";
import { EditableBullets } from "@/components/builder/inline/editable-bullets";
import { EditableLink } from "@/components/builder/inline/editable-link";
import { useEditing } from "@/components/builder/inline/editing-context";
import { IconPickerPopover } from "@/components/builder/inline/icon-picker-popover";
import { strengthIcons } from "@/lib/icons";
import { SectionNode, fontSizeAt } from "@/lib/schema/document";
import { customSectionUuid, useResumeStore } from "@/lib/store/useResumeStore";
import { Field, Icon, Item, ItemFlow, ItemHeaderRow } from "./primitives";
import {
  isFieldVisible,
  useSection,
  useSectionColors,
} from "./section-context";
import { SectionShell } from "./section-shell";
import { SectionRenderProps, inRange } from "./types";

/** The uuid keying into `customSections`, from the node's own id. */
const sourceUuid = (node: SectionNode) =>
  node.sourceId ?? customSectionUuid(node.id);

function Body({ itemRange }: { itemRange?: [number, number] }) {
  const customSections = useResumeStore((s) => s.resumeData.customSections);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { editable } = useEditing();
  const { node, theme } = useSection();
  const colors = useSectionColors();

  const custom = customSections.find((c) => c.id === sourceUuid(node));
  const items = custom?.items ?? [];
  // Items in a custom section are addressed as `custom:<uuid>`.
  const sectionKey = node.id as `custom:${string}`;

  const showIcon = isFieldVisible(node, "icon");
  const showLink = isFieldVisible(node, "link");
  const linkIcon = node.fields?.link?.icon ?? "ExternalLink";

  return (
    <ItemFlow>
      {inRange(items, itemRange).map(([item, index]) => {
        const link = showLink && (
          <EditableLink
            url={item.link || ""}
            onCommit={(v) => updateItem(sectionKey, item.id, { link: v })}
          >
            <Icon
              name={linkIcon}
              className="w-3 h-3 opacity-50 hover:opacity-100"
            />
          </EditableLink>
        );

        const subtitle = (
          <div className="font-medium mb-1" style={{ color: colors.accent }}>
            <Field
              name="subtitle"
              value={item.subtitle || ""}
              onCommit={(v) => updateItem(sectionKey, item.id, { subtitle: v })}
              placeholder="Subtitle"
              path={`${node.id}.${item.id}.subtitle`}
            />
          </div>
        );

        return (
          <Item
            key={item.id}
            sectionKey={sectionKey}
            itemId={item.id}
            index={index}
            count={items.length}
          >
            <ItemHeaderRow className="mb-0.5">
              <h3
                className="font-medium flex items-center gap-2 min-w-0"
                style={{ color: colors.text }}
              >
                {showIcon && item.icon && (
                  <IconPickerPopover
                    value={item.icon}
                    icons={strengthIcons}
                    onCommit={(icon) =>
                      updateItem(sectionKey, item.id, { icon })
                    }
                  >
                    <Icon
                      name={item.icon}
                      className="size-6 shrink-0 p-1 rounded-md"
                      style={{
                        color: colors.text,
                        backgroundColor: colors.chip,
                      }}
                    />
                  </IconPickerPopover>
                )}
                <Field
                  name="title"
                  value={item.title || ""}
                  onCommit={(v) =>
                    updateItem(sectionKey, item.id, { title: v })
                  }
                  placeholder="Title"
                  path={`${node.id}.${item.id}.title`}
                />
                {/* Without a URL the icon is just an affordance to add one. */}
                {item.link
                  ? link
                  : editable && <span data-editor-only>{link}</span>}
              </h3>
              <Field
                name="date"
                className="font-medium whitespace-nowrap ml-2"
                style={{ color: dim(colors.text, 80) }}
                value={item.date || ""}
                onCommit={(v) => updateItem(sectionKey, item.id, { date: v })}
                placeholder="Date"
                path={`${node.id}.${item.id}.date`}
              />
            </ItemHeaderRow>

            {item.subtitle ? (
              subtitle
            ) : editable ? (
              <div data-editor-only>{subtitle}</div>
            ) : null}

            {isFieldVisible(node, "description") && (
              <EditableBullets
                description={item.description || ""}
                bulletStyle={item.bulletStyle}
                textColor={colors.text}
                fontSize={fontSizeAt(
                  theme,
                  node.fields?.description?.step ?? 0,
                )}
                onCommit={(v) =>
                  updateItem(sectionKey, item.id, { description: v })
                }
                path={`${node.id}.${item.id}.description`}
              />
            )}
          </Item>
        );
      })}
    </ItemFlow>
  );
}

export function CustomSectionRenderer({
  node,
  theme,
  onFill,
  itemRange,
  continued,
}: SectionRenderProps) {
  const uuid = sourceUuid(node);
  const count = useResumeStore(
    (s) =>
      s.resumeData.customSections.find((c) => c.id === uuid)?.items.length ?? 0,
  );
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
