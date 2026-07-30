"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { isPersonalFieldVisible } from "@/lib/personal-fields";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { PersonalContactField } from "@/lib/types";
import { LucideIcon } from "lucide-react";
import { PersonalField } from "./personal-field";

interface ContactItemProps {
  field: PersonalContactField;
  icon?: LucideIcon;
  className?: string;
  style?: React.CSSProperties;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  /** Put the icon after the text (right-aligned headers). */
  iconAfter?: boolean;
  as?: React.ElementType;
}

/**
 * One contact line in the header. Hidden when the personal controller turns
 * the field off, or (outside the editor) when it has no value. Hiding never
 * clears the stored value.
 */
export function ContactItem({
  field,
  icon: Icon,
  className,
  style,
  iconClassName,
  iconStyle,
  iconAfter,
  as: Tag = "div",
}: ContactItemProps) {
  const { editable } = useEditing();
  const value = useResumeStore((s) => s.resumeData.personalInfo[field] ?? "");
  const settings = useResumeStore((s) => s.settings);

  if (!isPersonalFieldVisible(settings, field)) return null;
  if (!editable && !value) return null;

  const icon =
    Icon && settings.showContactIcons !== false ? (
      <Icon className={iconClassName} style={iconStyle} />
    ) : null;

  return (
    <Tag className={className} style={style}>
      {!iconAfter && icon}
      <PersonalField name={field} />
      {iconAfter && icon}
    </Tag>
  );
}
