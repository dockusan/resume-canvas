"use client";

import {
  FORMULA,
  GuideKind,
  PROMPTS,
  ROLE_FAMILIES,
  RoleFamily,
  reviewBullets,
} from "@/lib/guidance/writing";
import { cn } from "@/lib/utils";
import { ArrowRight, Lightbulb } from "lucide-react";
import { useState } from "react";

const FAMILY_KEY = "rc-role-family";

function readFamily(): RoleFamily {
  try {
    const saved = localStorage.getItem(FAMILY_KEY);
    if (ROLE_FAMILIES.some((f) => f.id === saved)) return saved as RoleFamily;
  } catch {
    // Storage unavailable; use the default.
  }
  return ROLE_FAMILIES[0].id;
}

/** The achievement formula and a weak → strong pair for the reader's field. */
function Examples() {
  // Only mounted once someone opens the guide, so reading storage in the
  // initializer can't disagree with a server render.
  const [family, setFamily] = useState<RoleFamily>(readFamily);
  const current = ROLE_FAMILIES.find((f) => f.id === family)!;

  return (
    <div className="space-y-2">
      <p className="text-[12px] leading-snug">
        {FORMULA.parts.map((part, i) => (
          <span key={part}>
            {i > 0 && <span className="text-muted-foreground"> + </span>}
            <span className="font-medium">{part}</span>
          </span>
        ))}
      </p>
      <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
        Examples for
        <select
          value={family}
          onChange={(e) => {
            const next = e.target.value as RoleFamily;
            setFamily(next);
            try {
              localStorage.setItem(FAMILY_KEY, next);
            } catch {
              // Not remembered; fine for this visit.
            }
          }}
          className="rounded border bg-background px-1.5 py-0.5 text-[11px] text-foreground"
        >
          {ROLE_FAMILIES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <ul className="space-y-2">
        {current.examples.map((ex) => (
          <li key={ex.weak} className="rounded-md border p-2 text-[12px]">
            <p className="text-muted-foreground line-through decoration-muted-foreground/40">
              {ex.weak}
            </p>
            <p className="mt-1 flex gap-1.5">
              <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              <span>{ex.strong}</span>
            </p>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Examples show the shape, not the facts — only use numbers you can stand
        behind in an interview.
      </p>
    </div>
  );
}

/** Notes on each bullet that could be stronger. */
export function BulletReview({
  description,
  className,
}: {
  description: string | undefined;
  className?: string;
}) {
  const reviews = reviewBullets(description);
  if (!reviews.length) return null;
  return (
    <ul
      aria-label="Suggestions for these points"
      className={cn("space-y-1.5", className)}
    >
      {reviews.map((r) => (
        <li key={`${r.line}-${r.text}`} className="text-[12px] leading-snug">
          <span className="text-muted-foreground">Point {r.line}:</span>{" "}
          {r.notes.join(" ")}
        </li>
      ))}
    </ul>
  );
}

/**
 * Guidance for one part of the resume: what it is for, the questions that
 * produce a strong line, examples, and — when an entry is selected — notes on
 * its own points.
 */
export function WritingGuide({
  kind,
  description,
  summary,
}: {
  kind: GuideKind;
  /** The selected entry's points, to review line by line. */
  description?: string;
  /** The summary text, for its length note. */
  summary?: string;
}) {
  const [open, setOpen] = useState(false);
  const guide = PROMPTS[kind];
  const summaryWords = summary?.trim() ? summary.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-2.5">
      <p className="flex gap-1.5 text-[12px] leading-snug">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        <span>{guide.lead}</span>
      </p>

      {kind === "summary" && summaryWords > 0 && (
        <p className="text-[12px] text-muted-foreground">
          {summaryWords} words
          {summaryWords > 70
            ? " — trim toward 30–60 so it's read, not skimmed."
            : summaryWords < 20
              ? " — a sentence or two more would say what you're best at."
              : " — a good length."}
        </p>
      )}

      {description !== undefined && <BulletReview description={description} />}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] font-medium text-primary hover:underline"
      >
        {open ? "Hide" : "Show"} questions and examples
      </button>
      {open && (
        <div className="space-y-3">
          <ul className="list-disc space-y-1 pl-4 text-[12px] leading-snug">
            {guide.prompts.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {kind !== "summary" && <Examples />}
        </div>
      )}
    </div>
  );
}
