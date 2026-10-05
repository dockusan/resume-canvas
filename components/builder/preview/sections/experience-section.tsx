"use client";

import { dim } from "@/lib/schema/css";
import { EditableBullets } from "@/components/builder/inline/editable-bullets";
import { EditableDateRange } from "@/components/builder/inline/editable-date";
import { fontSizeAt } from "@/lib/schema/document";
import { formatRange } from "@/lib/dates";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Field, Item, ItemFlow, ItemHeaderRow, Muted } from "./primitives";
import {
  isFieldVisible,
  useDateBelow,
  useSection,
  useSectionColors,
} from "./section-context";
import { SectionShell } from "./section-shell";
import { SectionRenderProps, inRange } from "./types";

function Body({ itemRange }: { itemRange?: [number, number] }) {
  const experience = useResumeStore((s) => s.resumeData.experience);
  const updateItem = useResumeStore((s) => s.updateItem);
  const dateFormat = useResumeStore((s) => s.settings.dateFormat);
  const { node, theme } = useSection();
  const colors = useSectionColors();

  const showDate = isFieldVisible(node, "date");
  const showCompany = isFieldVisible(node, "company");
  const showLocation = isFieldVisible(node, "location");
  const locationIcon = node.fields?.location?.icon;
  const dateBelow = useDateBelow();

  const dateEl = (exp: (typeof experience)[number], below: boolean) =>
    showDate && (
      <EditableDateRange
        startDate={exp.startDate}
        endDate={exp.endDate}
        current={exp.current}
        onCommit={(patch) => updateItem("experience", exp.id, patch)}
        className={
          below
            ? "block font-medium mb-0.5"
            : "font-medium whitespace-nowrap ml-2"
        }
        style={{
          color: dim(colors.text, 80),
          fontSize: fontSizeAt(theme, node.fields?.date?.step ?? -1),
        }}
        path={`experience.${exp.id}.date`}
      >
        {formatRange(exp, dateFormat, { start: "Start", end: "End" })}
      </EditableDateRange>
    );

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
            {!dateBelow && dateEl(exp, false)}
          </ItemHeaderRow>

          <div className="font-medium mb-0.5" style={{ color: colors.accent }}>
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
          {dateBelow && dateEl(exp, true)}

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
