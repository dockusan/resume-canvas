"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { EditableText } from "@/components/builder/inline/editable-text";
import { IconPickerPopover } from "@/components/builder/inline/icon-picker-popover";
import { ItemChrome } from "@/components/builder/inline/item-chrome";
import { getIconComponent, strengthIcons } from "@/lib/icons";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Sparkles } from "lucide-react";
import { SectionShell } from "./section-shell";
import { SectionRenderProps } from "./types";

export function StrengthsSection({
  section,
  config,
  baseSize,
}: SectionRenderProps) {
  const strengths = useResumeStore((s) => s.resumeData.strengths);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { editable } = useEditing();
  const textColor = config?.textColor || "#3e3e3e";
  return (
    <SectionShell
      section={section}
      config={config}
      isEmpty={strengths.length === 0}
    >
      <div className="space-y-3">
        {strengths.map((strength, index) => {
          const Icon = strength.icon ? getIconComponent(strength.icon) : null;
          const iconEl = Icon ? (
            <Icon
              className="size-7 shrink-0 mt-0.5 p-1.5 rounded-md"
              style={{
                color: textColor,
                backgroundColor: config?.iconBg || "rgba(0,0,0,0.05)",
              }}
            />
          ) : editable ? (
            <Sparkles
              className="size-7 shrink-0 mt-0.5 p-1.5 rounded-md opacity-30"
              style={{
                color: textColor,
                backgroundColor: config?.iconBg || "rgba(0,0,0,0.05)",
              }}
            />
          ) : null;
          return (
            <ItemChrome
              key={strength.id}
              sectionKey="strengths"
              itemId={strength.id}
              index={index}
              count={strengths.length}
              className={`flex gap-2 ${config?.itemClass || ""}`}
            >
              {iconEl && (
                <IconPickerPopover
                  value={strength.icon}
                  icons={strengthIcons}
                  onCommit={(icon) =>
                    updateItem("strengths", strength.id, { icon })
                  }
                >
                  {iconEl}
                </IconPickerPopover>
              )}
              <div>
                <h3
                  className="font-medium mb-0.5"
                  style={{ color: textColor, fontSize: baseSize.base - 1 }}
                >
                  <EditableText
                    value={strength.title}
                    onCommit={(v) =>
                      updateItem("strengths", strength.id, { title: v })
                    }
                    placeholder="Strength"
                    path={`strengths.${strength.id}.title`}
                  />
                </h3>
                <EditableText
                  value={strength.description}
                  onCommit={(v) =>
                    updateItem("strengths", strength.id, { description: v })
                  }
                  placeholder="Describe it briefly"
                  multiline
                  as="p"
                  className="leading-relaxed opacity-80"
                  style={{ color: textColor, fontSize: baseSize.base - 2 }}
                  path={`strengths.${strength.id}.description`}
                />
              </div>
            </ItemChrome>
          );
        })}
      </div>
    </SectionShell>
  );
}
