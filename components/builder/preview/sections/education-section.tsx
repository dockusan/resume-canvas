"use client";

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
  const education = useResumeStore((s) => s.resumeData.education);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { node, theme } = useSection();
  const colors = useSectionColors();

  const showDate = isFieldVisible(node, "date");
  const showSchool = isFieldVisible(node, "school");
  const showLocation = isFieldVisible(node, "location");
  const locationIcon = node.fields?.location?.icon;

  return (
    <ItemFlow>
      {inRange(education, itemRange).map(([edu, index]) => (
        <Item
          key={edu.id}
          sectionKey="education"
          itemId={edu.id}
          index={index}
          count={education.length}
        >
          <ItemHeaderRow className="mb-0.5">
            <Field
              name="degree"
              as="h3"
              className="font-medium"
              style={{ color: colors.text }}
              value={edu.degree}
              onCommit={(v) => updateItem("education", edu.id, { degree: v })}
              placeholder="Degree"
              path={`education.${edu.id}.degree`}
            />
            {showDate && (
              <EditableDateRange
                startDate={edu.startDate}
                endDate={edu.endDate}
                current={edu.current}
                onCommit={(patch) => updateItem("education", edu.id, patch)}
                className="font-medium whitespace-nowrap ml-2 opacity-80"
                style={{
                  color: colors.text,
                  fontSize: fontSizeAt(theme, node.fields?.date?.step ?? -1),
                }}
                path={`education.${edu.id}.date`}
              >
                {edu.startDate || "Start"} /{" "}
                {edu.current ? "Present" : edu.endDate || "End"}
              </EditableDateRange>
            )}
          </ItemHeaderRow>

          <div className="font-medium" style={{ color: colors.accent }}>
            <Field
              name="school"
              value={edu.school}
              onCommit={(v) => updateItem("education", edu.id, { school: v })}
              placeholder="School"
              path={`education.${edu.id}.school`}
            />
            {/* The comma only belongs between two visible values, and an
                icon on the location already separates them. */}
            {showSchool && showLocation && !locationIcon && (
              <Muted>{", "}</Muted>
            )}
            {showSchool && showLocation && locationIcon && <span> </span>}
            <Field
              name="location"
              value={edu.location}
              onCommit={(v) => updateItem("education", edu.id, { location: v })}
              placeholder="Location"
              path={`education.${edu.id}.location`}
            />
          </div>
        </Item>
      ))}
    </ItemFlow>
  );
}

export function EducationSection({
  node,
  theme,
  onFill,
  itemRange,
  continued,
}: SectionRenderProps) {
  const count = useResumeStore((s) => s.resumeData.education.length);
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
