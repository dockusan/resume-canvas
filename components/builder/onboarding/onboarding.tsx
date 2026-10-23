"use client";

import { Button } from "@/components/ui/button";
import { useAiDialogs, useAiEnabled } from "@/lib/ai/client";
import {
  ResumeState,
  isFirstVisit,
  resumeStore,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { FileText, PenLine, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";

/**
 * First use: choose a starting point, then a three-step tour of the one edit
 * that matters first (your name), where templates live, and where the files
 * come out. Progress is kept in this browser, so a reload mid-tour resumes it
 * and a finished or skipped tour never comes back on its own.
 */

const KEY = "rc-onboarding";

type Progress = { step: number } | "done";

function readProgress(): Progress | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Progress) : null;
  } catch {
    return null;
  }
}

function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Not persisted; the tour still runs for this visit.
  }
}

interface TourState {
  /** "welcome" shows the start dialog; a number is a tour step. */
  stage: "welcome" | number | null;
  start: (stage: "welcome" | number) => void;
  finish: () => void;
}

/** Shared so the toolbar's "Show the quick tour" can restart it. */
export const useTour = create<TourState>()((set) => ({
  stage: null,
  start: (stage) => {
    if (typeof stage === "number") saveProgress({ step: stage });
    set({ stage });
  },
  finish: () => {
    saveProgress("done");
    set({ stage: null });
  },
}));

const isNarrow = () => window.matchMedia("(max-width: 1023px)").matches;

interface Step {
  title: string;
  body: string | (() => string);
  /** The element the step points at, if it is on screen. */
  target: () => Element | null;
  /** Read from the store; the step completes when this changes. */
  watch?: (state: ResumeState) => unknown;
}

const STEPS: Step[] = [
  {
    title: "Make it yours",
    body: "Click your name on the page and type. Every line works the same way: click it, type, and it's saved.",
    // On a page, not in the hidden measuring copy of the document.
    target: () =>
      document.querySelector(
        "[data-main-sheet] [data-page] [data-resume-header] h1 [contenteditable]",
      ),
    watch: (s) => s.resumeData.personalInfo.fullName,
  },
  {
    title: "Try another look",
    body: () =>
      isNarrow()
        ? "Tap the design button at the top, then pick a template under Document. Only the styling changes; your words stay exactly as they are."
        : "Pick a template in the Document tab. Only the styling changes; your words stay exactly as they are.",
    target: () =>
      document.querySelector(
        isNarrow()
          ? "[data-tour='design-panel']"
          : "[data-tour='document-tab']",
      ),
    watch: (s) => s.document.preset,
  },
  {
    title: "Download when you're ready",
    body: "PDF exactly as designed, an ATS-safe PDF for job portals, Word or plain text. Your work is saved in this browser as you go.",
    target: () => document.querySelector("[data-tour='download']"),
  },
];

/** Outline the step's target. Screen only, so it can never print. */
function useHighlight(step: Step | undefined) {
  useEffect(() => {
    if (!step) return;
    let current: Element | null = null;
    const mark = () => {
      const next = step.target();
      if (next === current) return;
      current?.removeAttribute("data-tour-target");
      next?.setAttribute("data-tour-target", "");
      current = next;
    };
    mark();
    // The page re-renders as people type; keep the mark on the live node.
    const timer = setInterval(mark, 500);
    return () => {
      clearInterval(timer);
      current?.removeAttribute("data-tour-target");
    };
  }, [step]);
}

function Welcome() {
  const start = useTour((s) => s.start);
  const finish = useTour((s) => s.finish);
  const startBlank = useResumeStore((s) => s.startBlank);
  const aiEnabled = useAiEnabled();
  const openImport = useAiDialogs((s) => s.openImport);
  const firstChoice = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstChoice.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") start(0);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [start]);

  const choice =
    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div
      data-editor-only
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl"
      >
        <h2 id="welcome-title" className="text-base font-semibold">
          Let&rsquo;s make your resume
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything stays in this browser. How would you like to start?
        </p>
        <div className="mt-4 space-y-2">
          <button
            ref={firstChoice}
            type="button"
            className={choice}
            onClick={() => start(0)}
          >
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-medium">
                Start from the sample
              </span>
              <span className="block text-xs text-muted-foreground">
                A complete example resume. Type over it line by line.
              </span>
            </span>
          </button>
          <button
            type="button"
            className={choice}
            onClick={() => {
              startBlank();
              start(0);
            }}
          >
            <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-medium">
                Start with a blank page
              </span>
              <span className="block text-xs text-muted-foreground">
                The same sections, empty, ready for your details.
              </span>
            </span>
          </button>
          {aiEnabled && (
            <button
              type="button"
              className={choice}
              onClick={() => {
                finish();
                openImport();
              }}
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-medium">
                  Import the resume I have
                </span>
                <span className="block text-xs text-muted-foreground">
                  Upload a PDF or paste text, and the builder fills itself in.
                </span>
              </span>
            </button>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Moving from another browser? Use{" "}
          <span className="font-medium text-foreground">
            Import resume file
          </span>{" "}
          in the &hellip; menu.
        </p>
      </div>
    </div>
  );
}

function TourCard({ index }: { index: number }) {
  const start = useTour((s) => s.start);
  const finish = useTour((s) => s.finish);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  useHighlight(step);

  // A step with something to do completes when the person does it.
  useEffect(() => {
    if (!step.watch) return;
    const watch = step.watch;
    const initial = watch(resumeStore().getState());
    return resumeStore().subscribe((state) => {
      if (watch(state) !== initial) start(index + 1);
    });
  }, [step, index, start]);

  return (
    <section
      data-editor-only
      data-keeps-selection
      aria-label="Quick tour"
      aria-live="polite"
      className={cn(
        "fixed z-50 rounded-xl border bg-card p-4 shadow-2xl",
        "inset-x-3 bottom-3 sm:inset-x-auto sm:left-4 sm:bottom-4 sm:w-80",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
          Step {index + 1} of {STEPS.length}
        </p>
        <button
          type="button"
          onClick={finish}
          aria-label="Skip the tour"
          className="-m-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <h2 className="mt-1 text-sm font-semibold">{step.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {typeof step.body === "function" ? step.body() : step.body}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={finish}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Skip tour
        </button>
        <Button size="sm" onClick={() => (last ? finish() : start(index + 1))}>
          {last ? "Done" : step.watch ? "Skip this step" : "Next"}
        </Button>
      </div>
    </section>
  );
}

/** Mounted once in the builder. */
export function Onboarding() {
  const stage = useTour((s) => s.stage);
  const start = useTour((s) => s.start);
  const [checked, setChecked] = useState(false);

  // Decide once, after mount: storage isn't readable during render.
  useEffect(() => {
    if (checked) return;
    const progress = readProgress();
    const timer = setTimeout(() => {
      setChecked(true);
      if (progress && progress !== "done") start(progress.step);
      else if (!progress && isFirstVisit()) start("welcome");
    }, 0);
    return () => clearTimeout(timer);
  }, [checked, start]);

  if (stage === "welcome") return <Welcome />;
  if (typeof stage === "number" && stage < STEPS.length)
    return <TourCard key={stage} index={stage} />;
  return null;
}
