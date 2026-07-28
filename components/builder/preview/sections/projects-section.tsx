"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { EditableLink } from "@/components/builder/inline/editable-link";
import { EditableText } from "@/components/builder/inline/editable-text";
import { ItemChrome } from "@/components/builder/inline/item-chrome";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { ExternalLink } from "lucide-react";
import { SectionShell } from "./section-shell";
import { SectionRenderProps } from "./types";

export function ProjectsSection({
  section,
  config,
  baseSize,
}: SectionRenderProps) {
  const projects = useResumeStore((s) => s.resumeData.projects);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { editable } = useEditing();
  const textColor = config?.textColor || "#3e3e3e";
  const accentColor = config?.accentColor || "#008cff";
  return (
    <SectionShell
      section={section}
      config={config}
      isEmpty={projects.length === 0}
    >
      <div className="space-y-3">
        {projects.map((project, index) => (
          <ItemChrome
            key={project.id}
            sectionKey="projects"
            itemId={project.id}
            index={index}
            count={projects.length}
            className={config?.itemClass}
          >
            <div className="flex justify-between items-baseline mb-0.5">
              <h3
                className="font-medium flex items-center gap-2"
                style={{ color: textColor, fontSize: baseSize.title }}
              >
                <EditableText
                  value={project.name}
                  onCommit={(v) =>
                    updateItem("projects", project.id, { name: v })
                  }
                  placeholder="Project Name"
                  path={`projects.${project.id}.name`}
                />
                {project.link && !editable && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                    className="opacity-50 hover:opacity-100"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </h3>
              <span
                className="font-medium whitespace-nowrap ml-2 opacity-80"
                style={{ color: textColor, fontSize: baseSize.base - 3 }}
              >
                <EditableText
                  value={project.date}
                  onCommit={(v) =>
                    updateItem("projects", project.id, { date: v })
                  }
                  placeholder="Date"
                  path={`projects.${project.id}.date`}
                />
              </span>
            </div>
            {(project.link || editable) && (
              <EditableLink
                url={project.link}
                onCommit={(v) => updateItem("projects", project.id, { link: v })}
                className="block mb-1 hover:underline line-clamp-1"
                style={{ color: accentColor, fontSize: baseSize.base - 2 }}
              >
                {project.link || (editable ? "+ Add link" : "")}
              </EditableLink>
            )}
            <EditableText
              value={project.description}
              onCommit={(v) =>
                updateItem("projects", project.id, { description: v })
              }
              placeholder="Project description"
              multiline
              as="p"
              className="whitespace-pre-line leading-relaxed"
              style={{ color: textColor, fontSize: baseSize.base - 2 }}
              path={`projects.${project.id}.description`}
            />
          </ItemChrome>
        ))}
      </div>
    </SectionShell>
  );
}
