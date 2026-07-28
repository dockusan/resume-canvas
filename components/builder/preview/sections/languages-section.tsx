"use client";

import { EditableSelect } from "@/components/builder/inline/editable-select";
import { EditableText } from "@/components/builder/inline/editable-text";
import { ItemChrome } from "@/components/builder/inline/item-chrome";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { SectionShell } from "./section-shell";
import { SectionRenderProps } from "./types";

const PROFICIENCIES = [
  "Native",
  "Fluent",
  "Proficient",
  "Intermediate",
  "Basic",
] as const;

export function LanguagesSection({
  section,
  config,
  baseSize,
}: SectionRenderProps) {
  const languages = useResumeStore((s) => s.resumeData.languages);
  const updateItem = useResumeStore((s) => s.updateItem);
  const textColor = config?.textColor || "#3e3e3e";
  return (
    <SectionShell
      section={section}
      config={config}
      isEmpty={languages.length === 0}
    >
      <div className="space-y-2">
        {languages.map((lang, index) => {
          const level = lang.proficiency.includes("Native")
            ? 5
            : lang.proficiency.includes("Fluent")
              ? 4
              : lang.proficiency.includes("Proficient")
                ? 3
                : lang.proficiency.includes("Intermediate")
                  ? 2
                  : 1;
          return (
            <ItemChrome
              key={lang.id}
              sectionKey="languages"
              itemId={lang.id}
              index={index}
              count={languages.length}
              className="flex items-center justify-between"
              style={{ fontSize: baseSize.base - 2 }}
            >
              <div className="flex flex-col">
                <EditableText
                  value={lang.name}
                  onCommit={(v) => updateItem("languages", lang.id, { name: v })}
                  placeholder="Language"
                  className="font-medium"
                  style={{ color: textColor, fontSize: baseSize.base - 1 }}
                  path={`languages.${lang.id}.name`}
                />
                <EditableSelect
                  value={lang.proficiency}
                  options={PROFICIENCIES}
                  onCommit={(v) =>
                    updateItem("languages", lang.id, { proficiency: v })
                  }
                  className="opacity-70"
                  style={{ color: textColor, fontSize: baseSize.base - 3 }}
                >
                  {lang.proficiency}
                </EditableSelect>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-4 rounded-sm"
                    style={{
                      backgroundColor:
                        i <= level ? textColor : "rgba(150,150,150,0.2)",
                    }}
                  />
                ))}
              </div>
            </ItemChrome>
          );
        })}
      </div>
    </SectionShell>
  );
}
