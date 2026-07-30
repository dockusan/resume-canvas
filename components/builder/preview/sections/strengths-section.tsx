"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { IconPickerPopover } from "@/components/builder/inline/icon-picker-popover";
import { getIconComponent, strengthIcons } from "@/lib/icons";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Sparkles } from "lucide-react";
import { Field, Item, ItemFlow } from "./primitives";
import {
  isFieldVisible,
  useSection,
  useSectionColors,
} from "./section-context";
import { SectionShell } from "./section-shell";
import { SectionRenderProps, inRange } from "./types";

function Body({ itemRange }: { itemRange?: [number, number] }) {
  const strengths = useResumeStore((s) => s.resumeData.strengths);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { editable } = useEditing();
  const { node } = useSection();
  const colors = useSectionColors();

  const showIcon = isFieldVisible(node, "icon");
  const chip = { color: colors.text, backgroundColor: colors.chip };

  return (
    <ItemFlow>
      {inRange(strengths, itemRange).map(([strength, index]) => {
        const IconCmp = strength.icon ? getIconComponent(strength.icon) : null;
        // With no icon chosen yet, the editor still needs something to click.
        const icon = IconCmp ? (
          <IconCmp
            className="size-7 shrink-0 mt-0.5 p-1.5 rounded-md"
            style={chip}
          />
        ) : editable ? (
          <span
            data-editor-only
            className="size-7 shrink-0 mt-0.5 p-1.5 rounded-md opacity-30 inline-flex"
            style={chip}
          >
            <Sparkles className="w-full h-full" />
          </span>
        ) : null;

        return (
          <Item
            key={strength.id}
            sectionKey="strengths"
            itemId={strength.id}
            index={index}
            count={strengths.length}
          >
            <div className="flex gap-2">
              {showIcon && icon && (
                <IconPickerPopover
                  value={strength.icon}
                  icons={strengthIcons}
                  onCommit={(v) =>
                    updateItem("strengths", strength.id, { icon: v })
                  }
                >
                  {icon}
                </IconPickerPopover>
              )}
              <div className="min-w-0">
                <Field
                  name="title"
                  as="h3"
                  className="font-medium mb-0.5"
                  style={{ color: colors.text }}
                  value={strength.title}
                  onCommit={(v) =>
                    updateItem("strengths", strength.id, { title: v })
                  }
                  placeholder="Strength"
                  path={`strengths.${strength.id}.title`}
                />
                <Field
                  name="description"
                  as="p"
                  multiline
                  className="leading-relaxed opacity-80"
                  style={{ color: colors.text }}
                  value={strength.description}
                  onCommit={(v) =>
                    updateItem("strengths", strength.id, { description: v })
                  }
                  placeholder="Describe it briefly"
                  path={`strengths.${strength.id}.description`}
                />
              </div>
            </div>
          </Item>
        );
      })}
    </ItemFlow>
  );
}

export function StrengthsSection({
  node,
  theme,
  onFill,
  itemRange,
  continued,
}: SectionRenderProps) {
  const count = useResumeStore((s) => s.resumeData.strengths.length);
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
