"use client";

import {
  FirstPage,
  PAGE,
  pageFrameClass,
  sampleStore,
  useFitScale,
} from "@/components/home/sample-resume";
import { PRESET_META } from "@/lib/schema/presets";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
  const scale = useFitScale(frameRef);
  const stores = useMemo(() => SHOWCASE.map((id) => sampleStore(id)), []);

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
        className={cn(pageFrameClass, "rounded-md shadow-2xl")}
        style={{ aspectRatio: `${PAGE.width} / ${PAGE.height}` }}
      >
        {SHOWCASE.slice(0, mounted).map((id, i) => (
          <FirstPage
            key={id}
            store={stores[i]}
            scale={scale}
            visible={i === active}
          />
        ))}
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          The real editor, rendering the sample resume.{" "}
          <Link
            href={`/builder?template=${SHOWCASE[active]}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Start with {nameOf(SHOWCASE[active])}
          </Link>
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
