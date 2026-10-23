"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { keepsToEvidence } from "./evidence";
import {
  ImportedResume,
  MatchRequest,
  MatchSuggestion,
  QuickAddDraft,
  QuickAddSection,
  Rewrite,
  RewriteRequest,
} from "./types";

let availability: Promise<boolean> | null = null;

/**
 * Whether this deployment has AI configured. Asked once per page load; until
 * the answer arrives (and on any failure) the AI entry points stay hidden.
 */
export function useAiEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    availability ??= fetch("/api/ai")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((body: { enabled?: boolean }) => body.enabled === true)
      .catch(() => false);
    let live = true;
    availability.then((value) => live && setEnabled(value));
    return () => {
      live = false;
    };
  }, []);
  return enabled;
}

async function post<T>(
  path: string,
  body: BodyInit,
  json: boolean,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: json ? { "Content-Type": "application/json" } : undefined,
      body,
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection.");
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error ?? "Something went wrong. Please try again.",
    );
  }
  return payload as T;
}

export async function readResume(
  source: File | string,
): Promise<ImportedResume> {
  const form = new FormData();
  if (typeof source === "string") form.set("text", source);
  else form.set("file", source);
  const { resume } = await post<{ resume: ImportedResume }>(
    "/api/ai/import",
    form,
    false,
  );
  return resume;
}

export async function draftSection(request: {
  text: string;
  target: QuickAddSection | "auto";
  sectionTitle?: string;
}): Promise<QuickAddDraft> {
  const { draft } = await post<{ draft: QuickAddDraft }>(
    "/api/ai/quick-add",
    JSON.stringify(request),
    true,
  );
  return draft;
}

export async function rewriteItem(request: RewriteRequest): Promise<Rewrite> {
  const { rewrite } = await post<{ rewrite: Rewrite }>(
    "/api/ai/rewrite",
    JSON.stringify(request),
    true,
  );
  return rewrite;
}

/**
 * Evidence-based edits for a job's unmet requirements. Suggestions that add a
 * number the original line lacks are dropped here too, whatever the server
 * returned.
 */
export async function suggestMatches(
  request: MatchRequest,
): Promise<MatchSuggestion[]> {
  const { suggestions } = await post<{ suggestions: MatchSuggestion[] }>(
    "/api/ai/match",
    JSON.stringify(request),
    true,
  );
  const lines = new Map(request.evidence.map((e) => [e.id, e.text]));
  return suggestions.filter(
    (s) =>
      !s.revised ||
      (lines.has(s.evidenceId) &&
        keepsToEvidence(lines.get(s.evidenceId)!, s.revised)),
  );
}

/**
 * Which AI dialog is open, so any button — toolbar, outline, content form —
 * can open the one copy mounted by the builder.
 */
interface AiDialogs {
  importOpen: boolean;
  /** The section quick add opens on: a section id, or "auto". */
  quickAdd: string | null;
  openImport: () => void;
  openQuickAdd: (sectionId?: string) => void;
  close: () => void;
}

export const useAiDialogs = create<AiDialogs>()((set) => ({
  importOpen: false,
  quickAdd: null,
  openImport: () => set({ importOpen: true, quickAdd: null }),
  openQuickAdd: (sectionId = "auto") =>
    set({ quickAdd: sectionId, importOpen: false }),
  close: () => set({ importOpen: false, quickAdd: null }),
}));
