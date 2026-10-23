"use client";

import { ResumePreview } from "@/components/builder/preview/resume-preview";
import { PRESET_IDS } from "@/lib/schema/presets";
import { resumeStore, useResumeStore } from "@/lib/store/useResumeStore";
import { FileText } from "lucide-react";
import { useEffect } from "react";

/**
 * `/builder?template=banner` — the "Use this template" links. Applies the
 * template like picking it in the Document tab (content kept, one undo puts
 * the old styling back), then drops the parameter so a reload doesn't
 * re-apply it over later changes.
 */
function useTemplateFromUrl(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    const id = url.searchParams.get("template");
    if (!id) return;
    if (PRESET_IDS.includes(id)) resumeStore().getState().setPreset(id);
    url.searchParams.delete("template");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [ready]);
}

export default function BuilderPage() {
  const hasHydrated = useResumeStore((s) => s._hasHydrated);
  useTemplateFromUrl(hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/30">
        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[300px] border border-border">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin" />
            <FileText className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center w-full">
            <h3 className="text-lg font-bold">Loading Resume</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we prepare your workspace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main data-print-passthrough className="h-screen w-full overflow-hidden">
      <ResumePreview />
    </main>
  );
}
