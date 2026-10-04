"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { isPersonalFieldVisible } from "@/lib/personal-fields";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { PersonalContactField } from "@/lib/types";
import { DocIcon } from "./doc-icon";
import { PersonalField } from "./personal-field";

interface ContactItemProps {
  field: PersonalContactField;
  /** Registry icon name; the document renders it at a shared weight. */
  icon?: string;
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
  icon,
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

  const glyph =
    icon && settings.showContactIcons !== false ? (
      <DocIcon
        name={icon}
        className={iconClassName}
        style={{
          // Size with the text rather than at a fixed pixel box, and sit on
          // the text's optical centre: flex centring aligns to the line box,
          // whose middle is below the middle of the letterforms because it
          // includes descender space.
          width: "1.15em",
          height: "1.15em",
          marginTop: "-0.08em",
          ...iconStyle,
        }}
      />
    ) : null;

  return (
    // An empty contact is only on the page so it can be filled in; its icon
    // and ghost label must not reach the PDF.
    <Tag
      className={className}
      style={style}
      data-editor-only={value ? undefined : true}
    >
      {!iconAfter && glyph}
      <PersonalField name={field} />
      {iconAfter && glyph}
    </Tag>
  );
}
