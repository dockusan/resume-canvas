"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { fontSizeAt } from "@/lib/schema/document";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Plus } from "lucide-react";
import { Field, Item, ItemFlow } from "./primitives";
import { useSection, useSectionColors } from "./section-context";
import { SectionShell } from "./section-shell";
import { SectionRenderProps, inRange } from "./types";

function Body({ itemRange }: { itemRange?: [number, number] }) {
  const skills = useResumeStore((s) => s.resumeData.skills);
  const updateItem = useResumeStore((s) => s.updateItem);
  const addItem = useResumeStore((s) => s.addItem);
  const { editable } = useEditing();
  const { node, theme } = useSection();
  const colors = useSectionColors();

  // Skills are chips, so the item box doubles as the pill.
  const pill = {
    color: colors.text,
    backgroundColor: colors.chip,
    borderRadius: theme.radius.sm,
    padding: "2px 8px",
    display: "inline-block" as const,
  };

  return (
    <ItemFlow>
      {inRange(skills, itemRange).map(([skill, index]) => (
        <Item
          key={skill.id}
          sectionKey="skills"
          itemId={skill.id}
          index={index}
          count={skills.length}
          compact
        >
          <Field
            name="name"
            as="span"
            className="font-medium"
            style={pill}
            value={skill.name}
            onCommit={(v) => updateItem("skills", skill.id, { name: v })}
            placeholder="Skill"
            path={`skills.${skill.id}.name`}
          />
        </Item>
      ))}
      {editable && (
        <button
          type="button"
          title="Add skill"
          data-editor-only
          onClick={() => addItem("skills", { name: "" })}
          className="rounded-md border border-dashed opacity-40 hover:opacity-80 flex items-center"
          style={{
            color: colors.text,
            padding: "2px 8px",
            fontSize: fontSizeAt(theme, node.fields?.name?.step ?? 0),
          }}
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </ItemFlow>
  );
}

export function SkillsSection({
  node,
  theme,
  onFill,
  itemRange,
  continued,
}: SectionRenderProps) {
  const count = useResumeStore((s) => s.resumeData.skills.length);
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
