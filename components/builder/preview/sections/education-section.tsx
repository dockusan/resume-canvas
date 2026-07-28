"use client";

import { EditableDateRange } from "@/components/builder/inline/editable-date";
import { EditableText } from "@/components/builder/inline/editable-text";
import { ItemChrome } from "@/components/builder/inline/item-chrome";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { SectionShell } from "./section-shell";
import { SectionRenderProps } from "./types";

export function EducationSection({
  section,
  config,
  baseSize,
}: SectionRenderProps) {
  const education = useResumeStore((s) => s.resumeData.education);
  const updateItem = useResumeStore((s) => s.updateItem);
  const textColor = config?.textColor || "#3e3e3e";
  const accentColor = config?.accentColor || "#008cff";
  return (
    <SectionShell
      section={section}
      config={config}
      isEmpty={education.length === 0}
    >
      <div className="space-y-3">
        {education.map((edu, index) => (
          <ItemChrome
            key={edu.id}
            sectionKey="education"
            itemId={edu.id}
            index={index}
            count={education.length}
            className={
              config?.itemClass ||
              "border-b border-[#f3f4f6] pb-2 last:border-0 last:pb-0"
            }
          >
            <div className="flex justify-between items-baseline mb-0.5">
              <h3
                className="font-medium"
                style={{ color: textColor, fontSize: baseSize.title }}
              >
                <EditableText
                  value={edu.degree}
                  onCommit={(v) => updateItem("education", edu.id, { degree: v })}
                  placeholder="Degree"
                  path={`education.${edu.id}.degree`}
                />
              </h3>
              <EditableDateRange
                startDate={edu.startDate}
                endDate={edu.endDate}
                current={edu.current}
                onCommit={(patch) => updateItem("education", edu.id, patch)}
                className="font-medium whitespace-nowrap ml-2 opacity-80"
                style={{ color: textColor, fontSize: baseSize.base - 3 }}
                path={`education.${edu.id}.date`}
              >
                {edu.startDate || "Start"} /{" "}
                {edu.current ? "Present" : edu.endDate || "End"}
              </EditableDateRange>
            </div>
            <div
              className="font-medium"
              style={{ color: accentColor, fontSize: baseSize.base }}
            >
              <EditableText
                value={edu.school}
                onCommit={(v) => updateItem("education", edu.id, { school: v })}
                placeholder="School"
                path={`education.${edu.id}.school`}
              />
              {", "}
              <EditableText
                value={edu.location}
                onCommit={(v) =>
                  updateItem("education", edu.id, { location: v })
                }
                placeholder="Location"
                path={`education.${edu.id}.location`}
              />
            </div>
          </ItemChrome>
        ))}
      </div>
    </SectionShell>
  );
}
