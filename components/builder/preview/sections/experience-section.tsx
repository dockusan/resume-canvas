"use client";

import { EditableBullets } from "@/components/builder/inline/editable-bullets";
import { EditableDateRange } from "@/components/builder/inline/editable-date";
import { EditableText } from "@/components/builder/inline/editable-text";
import { ItemChrome } from "@/components/builder/inline/item-chrome";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { SectionShell } from "./section-shell";
import { SectionRenderProps } from "./types";

export function ExperienceSection({
  section,
  config,
  baseSize,
}: SectionRenderProps) {
  const experience = useResumeStore((s) => s.resumeData.experience);
  const updateItem = useResumeStore((s) => s.updateItem);
  const textColor = config?.textColor || "#3e3e3e";
  const accentColor = config?.accentColor || "#008cff";
  return (
    <SectionShell
      section={section}
      config={config}
      isEmpty={experience.length === 0}
    >
      <div className="space-y-4">
        {experience.map((exp, index) => (
          <ItemChrome
            key={exp.id}
            sectionKey="experience"
            itemId={exp.id}
            index={index}
            count={experience.length}
            className={`relative pt-1 ${config?.itemClass || "border-l-2 border-[#e5e7eb] pl-3 ml-1"}`}
          >
            {!config?.hideTimeline && (
              <div className="absolute -left-[5px] top-2.5 w-2 h-2 rounded-full bg-[#d1d5db]" />
            )}
            <div className="flex justify-between items-baseline mb-0.5">
              <h3
                className="font-medium"
                style={{ color: textColor, fontSize: baseSize.title }}
              >
                <EditableText
                  value={exp.title}
                  onCommit={(v) =>
                    updateItem("experience", exp.id, { title: v })
                  }
                  placeholder="Job Title"
                  path={`experience.${exp.id}.title`}
                />
              </h3>
              <EditableDateRange
                startDate={exp.startDate}
                endDate={exp.endDate}
                current={exp.current}
                onCommit={(patch) => updateItem("experience", exp.id, patch)}
                className="font-medium whitespace-nowrap ml-2 opacity-80"
                style={{ color: textColor, fontSize: baseSize.base - 3 }}
                path={`experience.${exp.id}.date`}
              >
                {exp.startDate || "Start"} /{" "}
                {exp.current ? "Present" : exp.endDate || "End"}
              </EditableDateRange>
            </div>
            <div
              className="font-medium mb-1"
              style={{ color: accentColor, fontSize: baseSize.base - 2 }}
            >
              <EditableText
                value={exp.company}
                onCommit={(v) =>
                  updateItem("experience", exp.id, { company: v })
                }
                placeholder="Company"
                path={`experience.${exp.id}.company`}
              />
              {" • "}
              <EditableText
                value={exp.location}
                onCommit={(v) =>
                  updateItem("experience", exp.id, { location: v })
                }
                placeholder="Location"
                path={`experience.${exp.id}.location`}
              />
            </div>
            <EditableBullets
              description={exp.description}
              bulletStyle={exp.bulletStyle}
              textColor={textColor}
              fontSize={baseSize.base}
              onCommit={(v) =>
                updateItem("experience", exp.id, { description: v })
              }
              path={`experience.${exp.id}.description`}
            />
          </ItemChrome>
        ))}
      </div>
    </SectionShell>
  );
}
