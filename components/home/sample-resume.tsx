"use client";

import { EditingProvider } from "@/components/builder/inline/editing-context";
import { PaginatedResume } from "@/components/builder/preview/canvas/paginated-resume";
import { PAGE_DIMENSIONS } from "@/lib/schema/document";
import { normalizeFontFamily } from "@/lib/schema/style-presets";
import {
  ResumeState,
  ResumeStoreProvider,
  createDetachedStore,
  sampleResume,
} from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { StoreApi } from "zustand";

/**
 * The sample resume, drawn by the builder's own renderer at thumbnail size.
 *
 * Shared by the homepage hero and the template gallery. Every copy renders
 * from a detached store, so showing one never reads or writes the visitor's
 * saved resume.
 */

export const PAGE = PAGE_DIMENSIONS.A4;

/** A detached store holding the sample in `presetId`. */
export function sampleStore(
  presetId: string,
  { showPhoto = false } = {},
): StoreApi<ResumeState> {
  const sample = sampleResume(presetId);
  return createDetachedStore({
    ...sample,
    settings: { ...sample.settings, showPhoto },
  });
}

/** Scale that fits a page's width to `ref`'s, or null until measured. */
export function useFitScale(ref: React.RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / PAGE.width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return scale;
}

/**
 * Page one of a resume, scaled into a frame that has the page's aspect
 * ratio. Absolutely positioned so several can be stacked and cross-faded.
 */
export function FirstPage({
  store,
  scale,
  visible = true,
}: {
  store: StoreApi<ResumeState>;
  scale: number | null;
  visible?: boolean;
}) {
  const font = normalizeFontFamily(store.getState().settings.fontFamily);
  return (
    <div
      // Page labels are editor furniture; only the paper shows here.
      className="absolute inset-0 origin-top-left transition-opacity duration-700 [&_[data-editor-only]]:hidden"
      style={{
        width: PAGE.width,
        fontFamily: font,
        transform: scale ? `scale(${scale})` : undefined,
        opacity: scale && visible ? 1 : 0,
      }}
    >
      <ResumeStoreProvider store={store}>
        <EditingProvider editable={false}>
          <PaginatedResume />
        </EditingProvider>
      </ResumeStoreProvider>
    </div>
  );
}

/** The frame a page sits in: white paper at A4 proportions. */
export const pageFrameClass =
  "relative w-full overflow-hidden bg-white ring-1 ring-black/10";

/**
 * A template's first page with the sample resume, rendered only once it
 * scrolls near the viewport — a gallery of fourteen full renders would
 * otherwise all lay out on load.
 */
export function TemplateThumbnail({
  presetId,
  photo,
  className,
}: {
  presetId: string;
  /** Show the template's photo slot, as a placeholder. */
  photo: boolean;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(frameRef);
  const [near, setNear] = useState(false);
  const store = useMemo(
    () => (near ? sampleStore(presetId, { showPhoto: photo }) : null),
    [near, presetId, photo],
  );

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      aria-hidden
      inert
      className={cn(pageFrameClass, className)}
      style={{ aspectRatio: `${PAGE.width} / ${PAGE.height}` }}
    >
      {store && <FirstPage store={store} scale={scale} />}
    </div>
  );
}
