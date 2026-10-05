"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { PhotoPopover } from "@/components/builder/inline/photo-popover";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { ImagePlus, User } from "lucide-react";
import Image from "next/image";

interface ResumePhotoProps {
  /** Rendered pixel size, used for the next/image intrinsic size. */
  size: number;
  photoBorderRadius: string;
  /** Classes for the framed photo box (size, border, shadow, …). */
  className?: string;
  style?: React.CSSProperties;
  /** Extra classes for the fallback silhouette (padding / background). */
  placeholderClassName?: string;
  alt?: string;
}

/**
 * The header photo, including the "photo is hidden" state. When hidden, an
 * editor-only ghost stays in the layout so the photo can always be brought
 * back — otherwise nothing remains in the document to click.
 */
export function ResumePhoto({
  size,
  photoBorderRadius,
  className,
  style,
  placeholderClassName,
  alt,
}: ResumePhotoProps) {
  const { editable } = useEditing();
  const photoUrl = useResumeStore((s) => s.resumeData.personalInfo.photoUrl);
  const fullName = useResumeStore((s) => s.resumeData.personalInfo.fullName);
  const showPhoto = useResumeStore((s) => s.settings.showPhoto);
  const updateSettings = useResumeStore((s) => s.updateSettings);

  if (showPhoto === false) {
    if (!editable) return null;
    // A slim link rather than a photo-sized ghost: a full-size placeholder
    // pushed the column down by ~100px that the PDF never has, so the
    // editor broke pages in different places from the export.
    return (
      <button
        type="button"
        title="Show photo"
        data-editor-only
        onClick={() => updateSettings({ showPhoto: true })}
        className="inline-flex items-center gap-1 rounded border border-dashed border-current px-1.5 py-0.5 text-[9px] uppercase tracking-wide opacity-30 hover:opacity-80 transition-opacity"
        contentEditable={false}
      >
        <ImagePlus className="w-3 h-3" />
        Add photo
      </button>
    );
  }

  if (!photoUrl && !editable) return null;

  return (
    <PhotoPopover>
      <div
        // Without a picture this is only the editor's "add a photo" target.
        data-editor-only={photoUrl ? undefined : true}
        className={cn("overflow-hidden", className)}
        style={{ ...style, borderRadius: photoBorderRadius }}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={alt || fullName}
            className="w-full h-full object-cover"
            width={size}
            height={size}
          />
        ) : (
          <User
            className={cn("w-full h-full opacity-40", placeholderClassName)}
          />
        )}
      </div>
    </PhotoPopover>
  );
}
