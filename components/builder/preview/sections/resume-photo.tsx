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
    return (
      <button
        type="button"
        title="Show photo"
        onClick={() => updateSettings({ showPhoto: true })}
        data-editor-only
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 border border-dashed border-current opacity-30 hover:opacity-80 transition-opacity",
          className,
        )}
        style={{ ...style, borderRadius: photoBorderRadius }}
        contentEditable={false}
      >
        <ImagePlus className="w-5 h-5" />
        <span className="text-[7px] uppercase tracking-wide">Show photo</span>
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
