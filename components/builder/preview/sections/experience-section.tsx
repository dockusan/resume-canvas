"use client";

import { EditableBullets } from "@/components/builder/inline/editable-bullets";
import { EditableDateRange } from "@/components/builder/inline/editable-date";
import { fontSizeAt } from "@/lib/schema/document";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Field, Item, ItemFlow, ItemHeaderRow, Muted } from "./primitives";
import {
  isFieldVisible,
  useSection,
  useSectionColors,
} from "./section-context";
import { SectionShell } from "./section-shell";
import { SectionRenderProps, inRange } from "./types";

function Body({ itemRange }: { itemRange?: [number, number] }) {
  const experience = useResumeStore((s) => s.resumeData.experience);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { node, theme } = useSection();
  const colors = useSectionColors();

  const showDate = isFieldVisible(node, "date");
  const showCompany = isFieldVisible(node, "company");
  const showLocation = isFieldVisible(node, "location");
  const locationIcon = node.fields?.location?.icon;

  return (
    <ItemFlow>
      {inRange(experience, itemRange).map(([exp, index]) => (
        <Item
          key={exp.id}
          sectionKey="experience"
          itemId={exp.id}
          index={index}
          count={experience.length}
        >
          <ItemHeaderRow>
            <Field
              name="title"
              as="h3"
              className="font-medium"
              style={{ color: colors.text }}
              value={exp.title}
              onCommit={(v) => updateItem("experience", exp.id, { title: v })}
              placeholder="Job Title"
              path={`experience.${exp.id}.title`}
            />
            {showDate && (
              <EditableDateRange
                startDate={exp.startDate}
                endDate={exp.endDate}
                current={exp.current}
                onCommit={(patch) => updateItem("experience", exp.id, patch)}
                className="font-medium whitespace-nowrap ml-2 opacity-80"
                style={{
                  color: colors.text,
                  fontSize: fontSizeAt(theme, node.fields?.date?.step ?? -1),
                }}
                path={`experience.${exp.id}.date`}
              >
                {exp.startDate || "Start"} /{" "}
                {exp.current ? "Present" : exp.endDate || "End"}
              </EditableDateRange>
            )}
          </ItemHeaderRow>

          <div className="font-medium mb-1" style={{ color: colors.accent }}>
            <Field
              name="company"
              value={exp.company}
              onCommit={(v) => updateItem("experience", exp.id, { company: v })}
              placeholder="Company"
              path={`experience.${exp.id}.company`}
            />
            {/* The bullet only belongs between two visible values, and an
                icon on the location already separates them. */}
            {showCompany && showLocation && !locationIcon && (
              <Muted>{" • "}</Muted>
            )}
            {showCompany && showLocation && locationIcon && <span> </span>}
            <Field
              name="location"
              value={exp.location}
              onCommit={(v) =>
                updateItem("experience", exp.id, { location: v })
              }
              placeholder="Location"
              path={`experience.${exp.id}.location`}
            />
          </div>

          {isFieldVisible(node, "description") && (
            <EditableBullets
              description={exp.description}
              bulletStyle={exp.bulletStyle}
              textColor={colors.text}
              fontSize={fontSizeAt(theme, node.fields?.description?.step ?? 0)}
              onCommit={(v) =>
                updateItem("experience", exp.id, { description: v })
              }
              path={`experience.${exp.id}.description`}
            />
          )}
        </Item>
      ))}
    </ItemFlow>
  );
}

export function ExperienceSection({
  node,
  theme,
  onFill,
  itemRange,
  continued,
}: SectionRenderProps) {
  const count = useResumeStore((s) => s.resumeData.experience.length);
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
