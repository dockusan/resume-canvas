"use client";

import { endPrintLayout, settleLayout } from "@/lib/pagination/use-measure";
import { spacingOf } from "@/lib/schema/document";
import { useDocument } from "@/lib/schema/use-document";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Loader2, Minimize2 } from "lucide-react";
import { useState } from "react";

/**
 * Steps from least to most visible change. Spacing goes first because
 * people notice smaller text long before they notice tighter gaps.
 */
const STEPS: { spacing: number; lineHeight: number; base: number }[] = [
  { spacing: 0.9, lineHeight: 0, base: 0 },
  { spacing: 0.8, lineHeight: -0.05, base: 0 },
  { spacing: 0.7, lineHeight: -0.08, base: 0 },
  { spacing: 0.65, lineHeight: -0.1, base: -0.5 },
  { spacing: 0.6, lineHeight: -0.12, base: -1 },
  { spacing: 0.55, lineHeight: -0.15, base: -1.5 },
];

const MIN_BASE = 11.5;
const MIN_LINE_HEIGHT = 1.2;

/** Pages the editor's sheet currently renders. */
function renderedPages(): number {
  return document.querySelectorAll("[data-main-sheet] [data-page]").length;
}

/**
 * "Fit to N pages": tightens spacing, then line height, then (only if it
 * must) text size, one step at a time, re-paginating after each, and stops
 * at the first step that fits. Measured without editor furniture so the
 * result matches the PDF. Every step is a normal edit, so Undo walks back.
 */
export function FitToPage({ pageCount }: { pageCount: number }) {
  const doc = useDocument();
  const updateTheme = useResumeStore((s) => s.updateTheme);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const target = pageCount > 2 ? 2 : 1;

  const run = async () => {
    setBusy(true);
    setMessage(null);
    const start = {
      spacing: spacingOf(doc.theme),
      lineHeight: doc.theme.fonts.body.lineHeight,
      base: doc.theme.scale.base,
    };

    let fitted = false;
    try {
      await settleLayout();
      if (renderedPages() <= target) {
        fitted = true;
      } else {
        for (const step of STEPS) {
          const factor = (v: number) => Math.min(v, v * step.spacing);
          updateTheme({
            spacing: {
              section: factor(start.spacing.section),
              item: factor(start.spacing.item),
              bullet: factor(start.spacing.bullet),
            },
            scale: { base: Math.max(MIN_BASE, start.base + step.base) },
            fonts: {
              body: {
                lineHeight: Math.max(
                  MIN_LINE_HEIGHT,
                  +(start.lineHeight + step.lineHeight).toFixed(2),
                ),
              },
            },
          });
          await settleLayout();
          if (renderedPages() <= target) {
            fitted = true;
            break;
          }
        }
      }
    } finally {
      endPrintLayout();
    }

    if (!fitted) {
      updateTheme({
        spacing: start.spacing,
        scale: { base: start.base },
        fonts: { body: { lineHeight: start.lineHeight } },
      });
      setMessage(
        `Still too long for ${target} page${target > 1 ? "s" : ""} at a readable size. Shorten a few bullets or hide a section, then try again.`,
      );
    } else {
      setMessage(
        `Fits on ${target} page${target > 1 ? "s" : ""}. Undo (⌘Z) reverts it.`,
      );
    }
    setBusy(false);
  };

  if (pageCount <= 1 && !message) return null;

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="w-full flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[13px] hover:bg-muted disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Minimize2 className="w-3.5 h-3.5" />
        )}
        {busy ? "Fitting…" : `Fit to ${target} page${target > 1 ? "s" : ""}`}
      </button>
      {message && (
        <p className="text-[11px] text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
