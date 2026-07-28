"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { EditableBullets } from "@/components/builder/inline/editable-bullets";
import { EditableLink } from "@/components/builder/inline/editable-link";
import { EditableText } from "@/components/builder/inline/editable-text";
import { IconPickerPopover } from "@/components/builder/inline/icon-picker-popover";
import { ItemChrome } from "@/components/builder/inline/item-chrome";
import { getIconComponent, strengthIcons } from "@/lib/icons";
import {
  customSectionUuid,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { ExternalLink } from "lucide-react";
import { SectionShell } from "./section-shell";
import { SectionRenderProps } from "./types";

export function CustomSectionRenderer({
  section,
  config,
  baseSize,
}: SectionRenderProps) {
  const customSections = useResumeStore((s) => s.resumeData.customSections);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { editable } = useEditing();
  const custom = customSections.find(
    (c) => c.id === customSectionUuid(section.id),
  );
  const items = custom?.items ?? [];
  const sectionKey = section.id as `custom:${string}`;
  const textColor = config?.textColor || "#3e3e3e";
  const accentColor = config?.accentColor || "#008cff";
  return (
    <SectionShell
      section={section}
      config={config}
      isEmpty={items.length === 0}
    >
      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = item.icon ? getIconComponent(item.icon) : null;
          return (
            <ItemChrome
              key={item.id}
              sectionKey={sectionKey}
              itemId={item.id}
              index={index}
              count={items.length}
              className={config?.itemClass}
            >
              <div className="flex justify-between items-baseline mb-0.5">
                <h3
                  className="font-medium flex items-center gap-2"
                  style={{ color: textColor, fontSize: baseSize.title }}
                >
                  {Icon && (
                    <IconPickerPopover
                      value={item.icon}
                      icons={strengthIcons}
                      onCommit={(icon) =>
                        updateItem(sectionKey, item.id, { icon })
                      }
                    >
                      <Icon
                        className="size-6 shrink-0 p-1 rounded-md"
                        style={{
                          color: textColor,
                          backgroundColor:
                            config?.iconBg || "rgba(0,0,0,0.05)",
                        }}
                      />
                    </IconPickerPopover>
                  )}
                  <EditableText
                    value={item.title || ""}
                    onCommit={(v) => updateItem(sectionKey, item.id, { title: v })}
                    placeholder="Title"
                    path={`${section.id}.${item.id}.title`}
                  />
                  {item.link && !editable && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="opacity-50 hover:opacity-100"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {editable && (
                    <EditableLink
                      url={item.link || ""}
                      onCommit={(v) =>
                        updateItem(sectionKey, item.id, { link: v })
                      }
                    >
                      <ExternalLink className="w-3 h-3 opacity-40" />
                    </EditableLink>
                  )}
                </h3>
                <span
                  className="font-medium whitespace-nowrap ml-2 opacity-80"
                  style={{ color: textColor, fontSize: baseSize.base - 3 }}
                >
                  <EditableText
                    value={item.date || ""}
                    onCommit={(v) => updateItem(sectionKey, item.id, { date: v })}
                    placeholder="Date"
                    path={`${section.id}.${item.id}.date`}
                  />
                </span>
              </div>
              {(item.subtitle || editable) && (
                <div
                  className="font-medium mb-1"
                  style={{ color: accentColor, fontSize: baseSize.base - 2 }}
                >
                  <EditableText
                    value={item.subtitle || ""}
                    onCommit={(v) =>
                      updateItem(sectionKey, item.id, { subtitle: v })
                    }
                    placeholder="Subtitle"
                    path={`${section.id}.${item.id}.subtitle`}
                  />
                </div>
              )}
              <EditableBullets
                description={item.description || ""}
                bulletStyle={item.bulletStyle}
                textColor={textColor}
                fontSize={baseSize.base}
                onCommit={(v) =>
                  updateItem(sectionKey, item.id, { description: v })
                }
                path={`${section.id}.${item.id}.description`}
              />
            </ItemChrome>
          );
        })}
      </div>
    </SectionShell>
  );
}
