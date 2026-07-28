"use client";

import { EditableText } from "@/components/builder/inline/editable-text";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { SectionShell } from "./section-shell";
import { SectionRenderProps } from "./types";

export function SummarySection({
  section,
  config,
  baseSize,
}: SectionRenderProps) {
  const summary = useResumeStore((s) => s.resumeData.personalInfo.summary);
  const setPersonalInfo = useResumeStore((s) => s.setPersonalInfo);
  return (
    <SectionShell section={section} config={config} isEmpty={false}>
      <EditableText
        value={summary}
        onCommit={(v) => setPersonalInfo({ summary: v })}
        placeholder="Write a short professional summary…"
        multiline
        as="p"
        className={`leading-relaxed ${summary ? "text-justify" : ""}`}
        style={{
          color: config?.textColor || "#3e3e3e",
          fontSize: baseSize.base,
        }}
        path="summary.text"
      />
    </SectionShell>
  );
}
