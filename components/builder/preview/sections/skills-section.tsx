"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { EditableText } from "@/components/builder/inline/editable-text";
import { ItemChrome } from "@/components/builder/inline/item-chrome";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Plus } from "lucide-react";
import { SectionShell } from "./section-shell";
import { SectionRenderProps } from "./types";

export function SkillsSection({
  section,
  config,
  baseSize,
}: SectionRenderProps) {
  const skills = useResumeStore((s) => s.resumeData.skills);
  const updateItem = useResumeStore((s) => s.updateItem);
  const addItem = useResumeStore((s) => s.addItem);
  const { editable } = useEditing();
  const textColor = config?.textColor || "#3e3e3e";
  return (
    <SectionShell
      section={section}
      config={config}
      isEmpty={skills.length === 0}
    >
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <ItemChrome
            key={skill.id}
            sectionKey="skills"
            itemId={skill.id}
            index={index}
            count={skills.length}
            compact
          >
            <EditableText
              value={skill.name}
              onCommit={(v) => updateItem("skills", skill.id, { name: v })}
              placeholder="Skill"
              as="span"
              className="px-2 py-1 rounded-md font-medium inline-block"
              style={{
                color: textColor,
                backgroundColor: config?.badgeBg || "rgba(0,0,0,0.05)",
                fontSize: baseSize.base - 2,
              }}
              path={`skills.${skill.id}.name`}
            />
          </ItemChrome>
        ))}
        {editable && (
          <button
            type="button"
            title="Add skill"
            onClick={() => addItem("skills", { name: "" })}
            className="px-2 py-1 rounded-md border border-dashed opacity-40 hover:opacity-80 flex items-center"
            style={{ color: textColor, fontSize: baseSize.base - 2 }}
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
    </SectionShell>
  );
}
