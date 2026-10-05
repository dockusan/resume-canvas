"use client";

import { dim } from "@/lib/schema/css";
import { EditableDateRange } from "@/components/builder/inline/editable-date";
import { fontSizeAt } from "@/lib/schema/document";
import { formatRange } from "@/lib/dates";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Field, Item, ItemFlow, ItemHeaderRow, Muted } from "./primitives";
import { DocIcon } from "./doc-icon";
import {
  isFieldVisible,
  useDateBelow,
  useSection,
  useSectionColors,
} from "./section-context";
import { SectionShell } from "./section-shell";
import { SectionRenderProps, inRange } from "./types";

function Body({ itemRange }: { itemRange?: [number, number] }) {
  const education = useResumeStore((s) => s.resumeData.education);
  const updateItem = useResumeStore((s) => s.updateItem);
  const dateFormat = useResumeStore((s) => s.settings.dateFormat);
  const { node, theme } = useSection();
  const colors = useSectionColors();

  const showDate = isFieldVisible(node, "date");
  const showSchool = isFieldVisible(node, "school");
  const showLocation = isFieldVisible(node, "location");
  const showIcon = isFieldVisible(node, "icon");
  const iconName = node.fields?.icon?.icon || "GraduationCap";
  const locationIcon = node.fields?.location?.icon;
  const dateBelow = useDateBelow();
  const chip = { color: colors.text, backgroundColor: colors.chip };

  return (
    <ItemFlow>
      {inRange(education, itemRange).map(([edu, index]) => {
        const date = showDate && (
          <EditableDateRange
            startDate={edu.startDate}
            endDate={edu.endDate}
            current={edu.current}
            onCommit={(patch) => updateItem("education", edu.id, patch)}
            className={
              dateBelow
                ? "block font-medium"
                : "font-medium whitespace-nowrap ml-2"
            }
            style={{
              color: dim(colors.text, 80),
              fontSize: fontSizeAt(theme, node.fields?.date?.step ?? -1),
            }}
            path={`education.${edu.id}.date`}
          >
            {formatRange(edu, dateFormat, { start: "Start", end: "End" })}
          </EditableDateRange>
        );

        const body = (
          <div className="min-w-0 flex-1">
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
              {!dateBelow && date}
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
                onCommit={(v) =>
                  updateItem("education", edu.id, { location: v })
                }
                placeholder="Location"
                path={`education.${edu.id}.location`}
              />
            </div>
            {dateBelow && date}
          </div>
        );

        return (
          <Item
            key={edu.id}
            sectionKey="education"
            itemId={edu.id}
            index={index}
            count={education.length}
          >
            {showIcon ? (
              <div className="flex gap-2">
                <span
                  className="size-7 shrink-0 mt-0.5 p-1.5 rounded-md inline-flex"
                  style={chip}
                >
                  <DocIcon name={iconName} className="w-full h-full" />
                </span>
                {body}
              </div>
            ) : (
              body
            )}
          </Item>
        );
      })}
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
