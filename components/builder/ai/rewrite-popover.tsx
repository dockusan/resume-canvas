"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { bulletLines } from "@/lib/ats/checks";
import { rewritePatch, rewriteRequestFor } from "@/lib/ai/apply";
import { rewriteItem } from "@/lib/ai/client";
import { MAX_INSTRUCTION_CHARS } from "@/lib/ai/limits";
import { RewriteKind } from "@/lib/ai/types";
import {
  SectionKey,
  customSectionUuid,
  isCustomSectionId,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { ResumeData } from "@/lib/types";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { AiError } from "./ai-dialog";

type Item = { id: string } & Record<string, unknown>;

function findItem(
  data: ResumeData,
  section: SectionKey,
  itemId: string,
): Item | undefined {
  const items = isCustomSectionId(section)
    ? data.customSections.find((c) => c.id === customSectionUuid(section))
        ?.items
    : data[section];
  return (items as Item[] | undefined)?.find((it) => it.id === itemId);
}

/**
 * "Improve with AI" for the selected item, opened from the selection rail:
 * a suggested set of points shown beside the current ones, editable, that
 * replaces them in one step — no trip to the content tab. The replace is a
 * single store update, so undo brings the old points back.
 *
 * `children` is the trigger. Mount one per item (key it by id) so a
 * suggestion never carries over to a different entry.
 */
export function RewritePopover({
  kind,
  sectionKey,
  itemId,
  children,
}: {
  kind: RewriteKind;
  sectionKey: SectionKey;
  itemId: string;
  children: React.ReactNode;
}) {
  const item = useResumeStore((s) =>
    findItem(s.resumeData, sectionKey, itemId),
  );
  const updateItem = useResumeStore((s) => s.updateItem);
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The suggestion, one point per line, as the person has edited it. */
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  const current = item ? bulletLines(String(item.description ?? "")) : [];

  const run = async () => {
    if (!item || drafting) return;
    setDrafting(true);
    setError(null);
    try {
      const next = await rewriteItem(
        rewriteRequestFor(kind, item, instruction),
      );
      setSuggestion(next.bullets.join("\n"));
      setNotes(next.notes);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't rewrite that entry.",
      );
    } finally {
      setDrafting(false);
    }
  };

  const points = suggestion ? bulletLines(suggestion) : [];

  const replace = () => {
    if (!item || !points.length) return;
    updateItem(sectionKey, itemId, rewritePatch(kind, item, points));
    setSuggestion(null);
    setNotes([]);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={8}
        className="flex w-96 max-w-[calc(100vw-16px)] max-h-(--radix-popover-content-available-height) flex-col overflow-hidden p-0"
        // The rail cancels mousedown to keep the canvas selection; React
        // bubbles portal events through it, which would stop these inputs
        // taking focus. Escape closes just this, not the selection too.
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.stopPropagation();
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Improve with AI
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Rewrites this entry&apos;s points. Facts and numbers are kept;
            nothing is made up. Sent to an AI model via OpenRouter, not stored.
          </p>

          <label className="mt-3 block text-[11px] font-medium text-muted-foreground">
            Instruction (optional)
          </label>
          <Textarea
            autoFocus
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run();
            }}
            maxLength={MAX_INSTRUCTION_CHARS}
            rows={2}
            disabled={drafting}
            placeholder="e.g. shorter, focus on leadership, write it in English"
            className="mt-1.5 min-h-0 text-sm"
          />

          {suggestion !== null && (
            <>
              {current.length > 0 && (
                <>
                  <p className="mt-4 text-[11px] font-medium text-muted-foreground">
                    Current
                  </p>
                  <ul className="mt-1.5 max-h-32 list-disc space-y-0.5 overflow-y-auto rounded-md border border-dashed px-3 py-2 pl-7 text-[12px] text-muted-foreground">
                    {current.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </>
              )}
              <p className="mt-3 text-[11px] font-medium text-muted-foreground">
                Suggested — one point per line, edit freely
              </p>
              <Textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                rows={Math.min(10, Math.max(3, points.length + 1))}
                disabled={drafting}
                className="mt-1.5 text-sm"
              />
              {notes.length > 0 && (
                <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                    To make it stronger
                  </p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[12px] text-muted-foreground">
                    {notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <AiError message={error} />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-muted/30 px-4 py-2.5">
          {suggestion === null ? (
            <Button size="sm" onClick={run} disabled={drafting || !item}>
              {drafting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              )}
              {drafting ? "Thinking…" : "Suggest"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={run}
                disabled={drafting}
              >
                {drafting && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Try again
              </Button>
              <Button
                size="sm"
                onClick={replace}
                disabled={drafting || !points.length}
              >
                Replace
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
