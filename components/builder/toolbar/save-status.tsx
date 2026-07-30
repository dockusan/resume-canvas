"use client";

import { resumeStore } from "@/lib/store/useResumeStore";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

function relative(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

/**
 * Reassurance that nothing is lost.
 *
 * Work is persisted to localStorage synchronously on every change, so this
 * never claims a save is "in progress" — it reports what actually happened
 * and when. The label is computed in an effect rather than during render,
 * since reading the clock while rendering is not pure.
 */
export function SaveStatus() {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [label, setLabel] = useState("Saved");

  useEffect(() => resumeStore().subscribe(() => setSavedAt(Date.now())), []);

  useEffect(() => {
    if (savedAt === null) return;
    const update = () => setLabel(`Saved ${relative(Date.now() - savedAt)}`);
    update();
    const timer = setInterval(update, 15000);
    return () => clearInterval(timer);
  }, [savedAt]);

  return (
    <span
      className="hidden items-center gap-1 text-[11px] text-muted-foreground lg:flex"
      title="Your work is stored in this browser"
    >
      <Check className="h-3 w-3 text-emerald-600" />
      {label}
    </span>
  );
}
