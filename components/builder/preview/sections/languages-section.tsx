"use client";

import { dim } from "@/lib/schema/css";
import { EditableSelect } from "@/components/builder/inline/editable-select";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { applyHtmlOverride, resolvePathOverride } from "@/lib/style-overrides";
import { Field, Item, ItemFlow } from "./primitives";
import {
  isFieldVisible,
  useFieldStyle,
  useSection,
  useSectionColors,
} from "./section-context";
import { SectionShell } from "./section-shell";
import { SectionRenderProps, inRange } from "./types";

const PROFICIENCIES = [
  "Native",
  "Fluent",
  "Proficient",
  "Intermediate",
  "Basic",
] as const;

/** Segments to light up in the 5-step meter for a proficiency label. */
function levelOf(proficiency: string): number {
  if (proficiency.includes("Native")) return 5;
  if (proficiency.includes("Fluent")) return 4;
  if (proficiency.includes("Proficient")) return 3;
  if (proficiency.includes("Intermediate")) return 2;
  return 1;
}

function Body({ itemRange }: { itemRange?: [number, number] }) {
  const languages = useResumeStore((s) => s.resumeData.languages);
  const updateItem = useResumeStore((s) => s.updateItem);
  const overrides = useResumeStore((s) => s.settings.styleOverrides);
  const { node } = useSection();
  const colors = useSectionColors();

  // EditableSelect has no `path` prop of its own, so the override cascade is
  // resolved here to keep per-field styling working on the proficiency.
  const proficiencyStyle = useFieldStyle("proficiency", {
    color: dim(colors.text, 70),
  });
  const showProficiency = isFieldVisible(node, "proficiency");
  const showMeter = isFieldVisible(node, "meter");

  return (
    <ItemFlow>
      {inRange(languages, itemRange).map(([lang, index]) => (
        <Item
          key={lang.id}
          sectionKey="languages"
          itemId={lang.id}
          index={index}
          count={languages.length}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex flex-col min-w-0">
              <Field
                name="name"
                className="font-medium"
                style={{ color: colors.text }}
                value={lang.name}
                onCommit={(v) => updateItem("languages", lang.id, { name: v })}
                placeholder="Language"
                path={`languages.${lang.id}.name`}
              />
              {showProficiency && (
                <EditableSelect
                  value={lang.proficiency}
                  options={PROFICIENCIES}
                  onCommit={(v) =>
                    updateItem("languages", lang.id, { proficiency: v })
                  }
                  style={applyHtmlOverride(
                    proficiencyStyle,
                    resolvePathOverride(
                      overrides,
                      `languages.${lang.id}.proficiency`,
                    ),
                  )}
                >
                  {lang.proficiency}
                </EditableSelect>
              )}
            </div>

            {showMeter && (
              <div className="flex gap-1 shrink-0">
                {[1, 2, 3, 4, 5].map((i) => {
                  const active = i <= levelOf(lang.proficiency);
                  return (
                    <div
                      key={i}
                      className="w-1.5 h-4 rounded-sm"
                      style={{
                        backgroundColor: active ? colors.accent : colors.border,
                        // Spent segments read as a translucent border rule.
                        opacity: active ? 1 : 0.4,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </Item>
      ))}
    </ItemFlow>
  );
}

export function LanguagesSection({
  node,
  theme,
  onFill,
  itemRange,
  continued,
}: SectionRenderProps) {
  const count = useResumeStore((s) => s.resumeData.languages.length);
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
