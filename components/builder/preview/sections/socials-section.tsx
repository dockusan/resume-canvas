"use client";

import { EditableLink } from "@/components/builder/inline/editable-link";
import { useEditing } from "@/components/builder/inline/editing-context";
import { IconPickerPopover } from "@/components/builder/inline/icon-picker-popover";
import { getIconData, socialIcons } from "@/lib/icons";
import { DocIcon } from "./doc-icon";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Social } from "@/lib/types";
import { Field, Icon, Item, ItemFlow } from "./primitives";
import {
  isFieldVisible,
  useSection,
  useSectionColors,
} from "./section-context";
import { SectionShell } from "./section-shell";
import { SectionRenderProps, inRange } from "./types";

/** The platform's icon, falling back to a generic globe. */
function renderSocialIcon(social: Social) {
  const name = social.icon || social.platform;
  return getIconData(name) ? (
    <DocIcon name={name} size={16} />
  ) : (
    <DocIcon name="Globe" size={16} />
  );
}

function Body({ itemRange }: { itemRange?: [number, number] }) {
  const socials = useResumeStore((s) => s.resumeData.socials);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { editable } = useEditing();
  const { node } = useSection();
  const colors = useSectionColors();

  const showIcon = isFieldVisible(node, "icon");
  const showLink = isFieldVisible(node, "link");
  const linkIcon = node.fields?.link?.icon ?? "ExternalLink";

  return (
    <ItemFlow>
      {inRange(socials, itemRange).map(([social, index]) => {
        const inner = (
          <>
            {showIcon && (
              <IconPickerPopover
                value={social.icon || social.platform}
                icons={socialIcons}
                onCommit={(icon) => updateItem("socials", social.id, { icon })}
              >
                <span
                  className="p-1.5 rounded-md inline-flex"
                  style={{ color: colors.text, backgroundColor: colors.chip }}
                >
                  {renderSocialIcon(social)}
                </span>
              </IconPickerPopover>
            )}
            <div className="min-w-0">
              <div className="font-medium flex items-center gap-1">
                <Field
                  name="platform"
                  value={social.platform}
                  onCommit={(v) =>
                    updateItem("socials", social.id, { platform: v })
                  }
                  placeholder="Platform"
                  style={{ color: colors.text }}
                  path={`socials.${social.id}.platform`}
                />
                {editable && showLink && (
                  <span data-editor-only>
                    <EditableLink
                      url={social.url}
                      onCommit={(v) =>
                        updateItem("socials", social.id, { url: v })
                      }
                    >
                      <Icon name={linkIcon} className="w-3 h-3 opacity-40" />
                    </EditableLink>
                  </span>
                )}
              </div>
              <Field
                name="username"
                as="div"
                className="truncate max-w-[120px] opacity-80"
                value={social.username}
                onCommit={(v) =>
                  updateItem("socials", social.id, { username: v })
                }
                placeholder="username"
                style={{ color: colors.text }}
                path={`socials.${social.id}.username`}
              />
            </div>
          </>
        );

        return (
          <Item
            key={social.id}
            sectionKey="socials"
            itemId={social.id}
            index={index}
            count={socials.length}
          >
            {/* Outside the editor the whole row stays a single link. */}
            {editable ? (
              <div className="flex items-center gap-2 min-w-0">{inner}</div>
            ) : (
              <a
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
              >
                {inner}
              </a>
            )}
          </Item>
        );
      })}
    </ItemFlow>
  );
}

export function SocialsSection({
  node,
  theme,
  onFill,
  itemRange,
  continued,
}: SectionRenderProps) {
  const count = useResumeStore((s) => s.resumeData.socials.length);
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
