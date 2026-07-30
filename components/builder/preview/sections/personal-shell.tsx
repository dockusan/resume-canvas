"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { cn } from "@/lib/utils";

/**
 * Wraps a layout's header block so personal info gets the same controller
 * treatment as a real section (it is not one — it lives in resumeData rather
 * than the column configs).
 */
export function PersonalShell({
  className,
  style,
  as: Tag = "header",
  children,
  ...rest
}: {
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
  children: React.ReactNode;
} & Record<string, unknown>) {
  const { editable, setActivePath } = useEditing();

  if (!editable) {
    return (
      <Tag className={className} style={style} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      className={cn("relative group/section", className)}
      style={style}
      onClick={() => setActivePath("personalInfo")}
      {...rest}
    >
      {children}
    </Tag>
  );
}
