"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { EditableLink } from "@/components/builder/inline/editable-link";
import { EditableText } from "@/components/builder/inline/editable-text";
import { IconPickerPopover } from "@/components/builder/inline/icon-picker-popover";
import { ItemChrome } from "@/components/builder/inline/item-chrome";
import { getIconComponent, socialIcons } from "@/lib/icons";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Social } from "@/lib/types";
import { ExternalLink, Globe } from "lucide-react";
import { SectionShell } from "./section-shell";
import { SectionRenderProps } from "./types";

function renderSocialIcon(social: Social) {
  const Icon = getIconComponent(social.icon || social.platform);
  return Icon ? <Icon className="w-4 h-4" /> : <Globe className="w-4 h-4" />;
}

export function SocialsSection({
  section,
  config,
  baseSize,
}: SectionRenderProps) {
  const socials = useResumeStore((s) => s.resumeData.socials);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { editable } = useEditing();
  const textColor = config?.textColor || "#3e3e3e";
  return (
    <SectionShell
      section={section}
      config={config}
      isEmpty={socials.length === 0}
    >
      <div className={config?.rowLayout ? "flex flex-wrap gap-4" : "space-y-2"}>
        {socials.map((social, index) => {
          const inner = (
            <>
              <IconPickerPopover
                value={social.icon || social.platform}
                icons={socialIcons}
                onCommit={(icon) => updateItem("socials", social.id, { icon })}
              >
                <div
                  className="p-1.5 rounded-md"
                  style={{
                    color: textColor,
                    backgroundColor: config?.iconBg || "rgba(0,0,0,0.05)",
                  }}
                >
                  {renderSocialIcon(social)}
                </div>
              </IconPickerPopover>
              <div style={{ color: textColor }}>
                <div
                  className="font-medium flex items-center gap-1"
                  style={{ fontSize: baseSize.base - 2 }}
                >
                  <EditableText
                    value={social.platform}
                    onCommit={(v) =>
                      updateItem("socials", social.id, { platform: v })
                    }
                    placeholder="Platform"
                    path={`socials.${social.id}.platform`}
                  />
                  {editable && (
                    <EditableLink
                      url={social.url}
                      onCommit={(v) =>
                        updateItem("socials", social.id, { url: v })
                      }
                    >
                      <ExternalLink className="w-3 h-3 opacity-40" />
                    </EditableLink>
                  )}
                </div>
                <div
                  className="truncate max-w-[120px] opacity-80"
                  style={{ fontSize: baseSize.base - 3 }}
                >
                  <EditableText
                    value={social.username}
                    onCommit={(v) =>
                      updateItem("socials", social.id, { username: v })
                    }
                    placeholder="username"
                    path={`socials.${social.id}.username`}
                  />
                </div>
              </div>
            </>
          );
          return editable ? (
            <ItemChrome
              key={social.id}
              sectionKey="socials"
              itemId={social.id}
              index={index}
              count={socials.length}
              className="flex items-center gap-2 group"
            >
              {inner}
            </ItemChrome>
          ) : (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
            >
              {inner}
            </a>
          );
        })}
      </div>
    </SectionShell>
  );
}
