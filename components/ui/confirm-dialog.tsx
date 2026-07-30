"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

/**
 * A modal confirmation.
 *
 * Deliberately not a Popover: one opened from a dropdown item is dismissed the
 * instant the menu closes, because the menu's own outside-pointer handling
 * counts as a click away. A modal owns its own dismissal and, for a
 * destructive action, deserves the focus trap anyway.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Focus the safe choice, not the destructive one.
    const frame = requestAnimationFrame(() => cancelRef.current?.focus());
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      data-editor-only
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0 bg-black/50"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-lg border bg-card p-4 shadow-2xl"
      >
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button
            ref={cancelRef}
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
