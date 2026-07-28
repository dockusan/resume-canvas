"use client";

import { EditableText } from "@/components/builder/inline/editable-text";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { PersonalInfo } from "@/lib/types";

type PersonalTextField = Exclude<keyof PersonalInfo, "photoUrl">;

const PLACEHOLDERS: Partial<Record<PersonalTextField, string>> = {
  fullName: "Your Name",
  title: "Job Title",
  email: "Email",
  phone: "Phone",
  location: "Location",
  website: "Website",
  linkedin: "LinkedIn",
  github: "GitHub",
  twitter: "Twitter",
  summary: "Write a short professional summary…",
};

interface PersonalFieldProps {
  name: PersonalTextField;
  as?: React.ElementType;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Inline-editable personal-info field, used in section + layout headers. */
export function PersonalField({
  name,
  as = "span",
  multiline,
  className,
  style,
}: PersonalFieldProps) {
  const value = useResumeStore((s) => s.resumeData.personalInfo[name] ?? "");
  const setPersonalInfo = useResumeStore((s) => s.setPersonalInfo);
  return (
    <EditableText
      value={value}
      onCommit={(v) => setPersonalInfo({ [name]: v })}
      placeholder={PLACEHOLDERS[name] ?? name}
      as={as}
      multiline={multiline}
      className={className}
      style={style}
      path={`personalInfo.${name}`}
    />
  );
}
