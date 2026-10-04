"use client";

import { useResumeStore } from "@/lib/store/useResumeStore";
import { Field } from "./primitives";
import { useSectionColors } from "./section-context";
import { SectionShell } from "./section-shell";
import { SectionRenderProps } from "./types";

function Body() {
  const summary = useResumeStore((s) => s.resumeData.personalInfo.summary);
  const setPersonalInfo = useResumeStore((s) => s.setPersonalInfo);
  const colors = useSectionColors();

  return (
    <Field
      name="text"
      as="p"
      multiline
      style={{ color: colors.text }}
      value={summary}
      onCommit={(v) => setPersonalInfo({ summary: v })}
      placeholder="Write a short professional summary…"
      path="summary.text"
    />
  );
}

export function SummarySection({
  node,
  theme,
  onFill,
  continued,
}: SectionRenderProps) {
  return (
    // Summary has no items: it never shows the dashed "add item" placeholder,
    // an empty summary is just an empty paragraph you can click into.
    <SectionShell
      node={node}
      theme={theme}
      onFill={onFill}
      continued={continued}
      isEmpty={false}
    >
      <Body />
    </SectionShell>
  );
}
