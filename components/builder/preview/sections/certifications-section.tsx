"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { EditableLink } from "@/components/builder/inline/editable-link";
import { EditableText } from "@/components/builder/inline/editable-text";
import { ItemChrome } from "@/components/builder/inline/item-chrome";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { ExternalLink } from "lucide-react";
import { SectionShell } from "./section-shell";
import { SectionRenderProps } from "./types";

export function CertificationsSection({
  section,
  config,
  baseSize,
}: SectionRenderProps) {
  const certifications = useResumeStore((s) => s.resumeData.certifications);
  const updateItem = useResumeStore((s) => s.updateItem);
  const { editable } = useEditing();
  const textColor = config?.textColor || "#3e3e3e";
  return (
    <SectionShell
      section={section}
      config={config}
      isEmpty={certifications.length === 0}
    >
      <div className="space-y-3">
        {certifications.map((cert, index) => (
          <ItemChrome
            key={cert.id}
            sectionKey="certifications"
            itemId={cert.id}
            index={index}
            count={certifications.length}
          >
            <h3
              className="font-medium mb-0.5"
              style={{ color: textColor, fontSize: baseSize.base - 2 }}
            >
              <EditableText
                value={cert.name}
                onCommit={(v) =>
                  updateItem("certifications", cert.id, { name: v })
                }
                placeholder="Certification"
                path={`certifications.${cert.id}.name`}
              />
            </h3>
            <p
              className="opacity-80"
              style={{ color: textColor, fontSize: baseSize.base - 2 }}
            >
              <EditableText
                value={cert.issuer}
                onCommit={(v) =>
                  updateItem("certifications", cert.id, { issuer: v })
                }
                placeholder="Issuer"
                path={`certifications.${cert.id}.issuer`}
              />
              {(cert.link || editable) && (
                <EditableLink
                  url={cert.link || ""}
                  onCommit={(v) =>
                    updateItem("certifications", cert.id, { link: v })
                  }
                  className="underline hover:opacity-100 opacity-80 inline-block ml-1"
                >
                  <ExternalLink className="w-3 h-3 inline" />
                </EditableLink>
              )}
            </p>
            {(cert.description || editable) && (
              <EditableText
                value={cert.description || ""}
                onCommit={(v) =>
                  updateItem("certifications", cert.id, { description: v })
                }
                placeholder="Description (optional)"
                multiline
                as="p"
                className="mt-1 leading-relaxed opacity-70"
                style={{ color: textColor, fontSize: baseSize.base - 3 }}
                path={`certifications.${cert.id}.description`}
              />
            )}
          </ItemChrome>
        ))}
      </div>
    </SectionShell>
  );
}
