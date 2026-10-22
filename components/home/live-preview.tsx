"use client";

import { EditingProvider } from "@/components/builder/inline/editing-context";
import { PaginatedResume } from "@/components/builder/preview/canvas/paginated-resume";
import { PAGE_DIMENSIONS } from "@/lib/schema/document";
import { PRESET_META } from "@/lib/schema/presets";
import { normalizeFontFamily } from "@/lib/schema/style-presets";
import {
  ResumeStoreProvider,
  createDetachedStore,
  sampleResume,
} from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

/** Templates the hero cycles through: four visibly different layouts. */
const SHOWCASE = ["classic", "banner", "clean", "cards"] as const;
const INTERVAL_MS = 5000;

const nameOf = (id: string) => PRESET_META.find((p) => p.id === id)?.name ?? id;

/**
 * The first page of the sample resume, drawn by the builder's own renderer
 * rather than a screenshot, so what the hero shows is exactly what a visitor
 * gets. It cycles through a few templates until someone picks one.
 *
 * Every template is rendered from a detached store: nothing here reads or
 * writes the visitor's saved resume.
 */
export function LivePreview({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [paused, setPaused] = useState(false);
  // The first template renders straight away; the rest mount once the page
  // is idle, so switching to them is a fade rather than a fresh layout.
  const [mounted, setMounted] = useState(1);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  const page = PAGE_DIMENSIONS.A4;
  const stores = useMemo(
    () => SHOWCASE.map((id) => createDetachedStore(sampleResume(id))),
    [],
  );
  const font = normalizeFontFamily(stores[0].getState().settings.fontFamily);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / page.width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [page.width]);

  useEffect(() => {
    const idle =
      window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 600));
    const handle = idle(() => setMounted(SHOWCASE.length));
    return () => (window.cancelIdleCallback ?? clearTimeout)(handle as number);
  }, []);

  useEffect(() => {
    if (reduceMotion || pinned || paused) return;
    const timer = setInterval(
      () => setActive((i) => (i + 1) % SHOWCASE.length),
      INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [reduceMotion, pinned, paused]);

  return (
    <figure
      className={cn("flex flex-col gap-3", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={frameRef}
        // Sample content, not page content: hidden from assistive tech and
        // out of the tab order. The caption says what it is.
        aria-hidden
        inert
        className="relative w-full overflow-hidden rounded-md bg-white shadow-2xl ring-1 ring-black/10"
        style={{ aspectRatio: `${page.width} / ${page.height}` }}
      >
        {SHOWCASE.slice(0, mounted).map((id, i) => (
          <div
            key={id}
            data-template={id}
            // Page labels are editor furniture; only the paper shows here.
            className="absolute inset-0 origin-top-left transition-opacity duration-700 [&_[data-editor-only]]:hidden"
            style={{
              width: page.width,
              fontFamily: font,
              transform: scale ? `scale(${scale})` : undefined,
              opacity: scale && i === active ? 1 : 0,
            }}
          >
            <ResumeStoreProvider store={stores[i]}>
              <EditingProvider editable={false}>
                <PaginatedResume />
              </EditingProvider>
            </ResumeStoreProvider>
          </div>
        ))}
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          The real editor, rendering the sample resume
        </span>
        <span
          role="group"
          aria-label="Template shown in the preview"
          className="flex rounded-full border bg-background p-0.5"
        >
          {SHOWCASE.map((id, i) => (
            <button
              key={id}
              type="button"
              aria-pressed={i === active}
              onClick={() => {
                setMounted(SHOWCASE.length);
                setActive(i);
                setPinned(true);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                i === active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {nameOf(id)}
            </button>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}
