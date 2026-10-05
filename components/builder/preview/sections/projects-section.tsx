"use client";

import { dim } from "@/lib/schema/css";
import { EditableLink } from "@/components/builder/inline/editable-link";
import { useEditing } from "@/components/builder/inline/editing-context";
import { fontSizeAt } from "@/lib/schema/document";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { shortUrl } from "@/lib/utils";
import { Field, Icon, Item, ItemFlow, ItemHeaderRow } from "./primitives";
import {
  isFieldVisible,
  useSection,
  useSectionColors,
} from "./section-context";
import { SectionShell } from "./section-shell";
import { SectionRenderProps, inRange } from "./types";

function Body({ itemRange }: { itemRange?: [number, number] }) {
  const projects = useResumeStore((s) => s.resumeData.projects);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { editable } = useEditing();
  const { node, theme } = useSection();
  const colors = useSectionColors();

  const showLink = isFieldVisible(node, "link");
  // The header icon is the link field's own icon; it falls back so a cleared
  // icon still leaves the read-only link affordance in place.
  const linkIcon = node.fields?.link?.icon ?? "ExternalLink";

  return (
    <ItemFlow>
      {inRange(projects, itemRange).map(([project, index]) => (
        <Item
          key={project.id}
          sectionKey="projects"
          itemId={project.id}
          index={index}
          count={projects.length}
        >
          <ItemHeaderRow className="mb-0.5">
            <h3
              className="font-medium flex items-center gap-2 min-w-0"
              style={{ color: colors.text }}
            >
              <Field
                name="name"
                value={project.name}
                onCommit={(v) =>
                  updateItem("projects", project.id, { name: v })
                }
                placeholder="Project Name"
                path={`projects.${project.id}.name`}
              />
              {showLink && project.link && !editable && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-50 hover:opacity-100"
                >
                  <Icon name={linkIcon} className="w-3 h-3 shrink-0" />
                </a>
              )}
            </h3>
            <Field
              name="date"
              className="font-medium whitespace-nowrap ml-2"
              style={{ color: dim(colors.text, 80) }}
              value={project.date}
              onCommit={(v) => updateItem("projects", project.id, { date: v })}
              placeholder="Date"
              path={`projects.${project.id}.date`}
            />
          </ItemHeaderRow>

          {showLink && (project.link || editable) && (
            // With no URL yet this is just the "add link" affordance, so it
            // must not print.
            <div data-editor-only={project.link ? undefined : ""}>
              <EditableLink
                url={project.link}
                onCommit={(v) =>
                  updateItem("projects", project.id, { link: v })
                }
                className="block mb-0.5 hover:underline line-clamp-1"
                style={{
                  color: colors.accent,
                  fontSize: fontSizeAt(theme, node.fields?.link?.step ?? 0),
                }}
              >
                {project.link
                  ? shortUrl(project.link)
                  : editable
                    ? "+ Add link"
                    : ""}
              </EditableLink>
            </div>
          )}

          <Field
            name="description"
            as="p"
            multiline
            className="whitespace-pre-line"
            style={{ color: colors.text }}
            value={project.description}
            onCommit={(v) =>
              updateItem("projects", project.id, { description: v })
            }
            placeholder="Project description"
            path={`projects.${project.id}.description`}
          />
        </Item>
      ))}
    </ItemFlow>
  );
}

export function ProjectsSection({
  node,
  theme,
  onFill,
  itemRange,
  continued,
}: SectionRenderProps) {
  const count = useResumeStore((s) => s.resumeData.projects.length);
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
