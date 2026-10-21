"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect } from "react";

/**
 * The modal both AI dialogs sit in.
 *
 * z-50 rather than the share dialog's z-[60] on purpose: the date and select
 * controls inside portal their menus to the end of <body> at z-50, and only
 * a tie (broken by DOM order) keeps those menus above the dialog.
 */
export function AiDialog({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // An open select or date menu handles its own Escape first.
      if (
        e.key === "Escape" &&
        !document.querySelector("[data-radix-popper-content-wrapper]")
      )
        onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-editor-only
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border bg-card shadow-2xl"
      >
        <div className="shrink-0 px-5 pt-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="flex items-center gap-1.5 pr-6 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Scrolling middle of the dialog. */
export function AiDialogBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
  );
}

/** Pinned action row, so the primary button never scrolls out of reach. */
export function AiDialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-muted/30 px-5 py-3">
      {children}
    </div>
  );
}

export function AiError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
      {message}
    </p>
  );
}
