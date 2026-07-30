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
  const { editable, activePath, setActivePath } = useEditing();
  const selected =
    activePath === "personalInfo" || !!activePath?.startsWith("personalInfo.");

  if (!editable) {
    return (
      <Tag className={className} style={style} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      className={cn(
        "relative group/section rounded-[3px]",
        // Without this the header gave no sign it was selectable, so its
        // settings — the background band among them — were unreachable
        // unless you already knew to click it.
        "hover:outline hover:outline-1 hover:outline-sky-300/40 hover:outline-offset-4",
        selected && "outline outline-1 outline-sky-400/70 outline-offset-4",
        className,
      )}
      style={style}
      onClick={(e: React.MouseEvent) => {
        // Clicking the header's own padding still selects it — unlike a
        // section, there is nothing else the blank area could mean.
        e.stopPropagation();
        setActivePath("personalInfo");
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
