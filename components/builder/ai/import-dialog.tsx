"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importSummary, importedToResumeData } from "@/lib/ai/apply";
import { readResume, useAiDialogs } from "@/lib/ai/client";
import {
  ACCEPTED_UPLOADS,
  MAX_SOURCE_CHARS,
  MAX_UPLOAD_BYTES,
} from "@/lib/ai/limits";
import { ImportedResume } from "@/lib/ai/types";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { FileUp, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { AiDialog, AiDialogBody, AiDialogFooter, AiError } from "./ai-dialog";

type Mode = "replace" | "merge";

/**
 * Fills the editor from a resume someone already has — a PDF or text file,
 * or pasted text — so nobody retypes a CV field by field.
 *
 * Nothing is applied until the person has seen what was found and chosen
 * whether it replaces or adds to their content; either way it is one undo.
 */
export function ImportDialog() {
  const open = useAiDialogs((s) => s.importOpen);
  // Mounted only while open, so every visit starts from a clean slate.
  return open ? <ImportFlow /> : null;
}

function ImportFlow() {
  const close = useAiDialogs((s) => s.close);
  const importContent = useResumeStore((s) => s.importContent);

  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportedResume | null>(null);
  const [mode, setMode] = useState<Mode>("replace");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const choose = useCallback((next: File | undefined) => {
    if (!next) return;
    setError(
      next.size > MAX_UPLOAD_BYTES
        ? `That file is over ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`
        : null,
    );
    setFile(next.size > MAX_UPLOAD_BYTES ? null : next);
  }, []);

  const read = async () => {
    const source = file ?? text.trim();
    if (!source) return;
    setReading(true);
    setError(null);
    try {
      setResult(await readResume(source));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that.");
    } finally {
      setReading(false);
    }
  };

  const apply = () => {
    if (!result) return;
    const { data, titles } = importedToResumeData(result);
    importContent(data, titles, mode);
    close();
  };

  const canRead = Boolean(file || text.trim().length >= 50) && !reading;

  return (
    <AiDialog
      open
      title="Import your resume"
      description={
        result
          ? "Here is what was found. Check it, then choose how to use it."
          : "Upload the resume you already have — or paste its text — and the editor fills itself in. No retyping."
      }
      onClose={close}
    >
      {!result ? (
        <>
          <AiDialogBody>
            {file ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2.5">
                <FileUp className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {file.name}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {Math.max(1, Math.round(file.size / 1024))} KB
                </span>
                <button
                  type="button"
                  aria-label="Remove file"
                  disabled={reading}
                  onClick={() => setFile(null)}
                  className="rounded p-1 text-muted-foreground hover:bg-background"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    choose(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
                    dragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <FileUp className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Choose a file or drop it here
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    PDF, .txt or .md · up to {MAX_UPLOAD_BYTES / 1024 / 1024} MB
                  </span>
                </button>
                <input
                  ref={input}
                  type="file"
                  accept={ACCEPTED_UPLOADS}
                  className="hidden"
                  onChange={(e) => {
                    choose(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />

                <div className="my-3 flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  or paste the text
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={MAX_SOURCE_CHARS}
                  rows={5}
                  disabled={reading}
                  placeholder="Paste your resume, or your LinkedIn profile's text…"
                  className="max-h-48 text-sm"
                />
              </>
            )}

            <AiError message={error} />

            {/* What happens to the file, in plain terms: this is one of only
                two places the editor sends anything anywhere. */}
            <div className="mt-4 flex gap-2 rounded-md bg-muted/50 p-3">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                To read it, the text of your resume is sent to our server and on
                to an AI model through OpenRouter. We don&apos;t store it, and
                nothing changes in the editor until you confirm.
              </p>
            </div>
          </AiDialogBody>
          <AiDialogFooter>
            <Button variant="outline" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button size="sm" onClick={read} disabled={!canRead}>
              {reading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              )}
              {reading ? "Reading… (about 20 s)" : "Read my resume"}
            </Button>
          </AiDialogFooter>
        </>
      ) : (
        <>
          <AiDialogBody>
            <ImportReview resume={result} />

            <fieldset className="mt-5 space-y-2">
              <legend className="mb-2 text-xs font-medium">
                What should happen to your current content?
              </legend>
              <ModeOption
                checked={mode === "replace"}
                onSelect={() => setMode("replace")}
                title="Replace it"
                hint="Everything you've written is swapped for this. Your template, design and photo stay."
              />
              <ModeOption
                checked={mode === "merge"}
                onSelect={() => setMode("merge")}
                title="Add to it"
                hint="New entries go below yours; only empty header fields are filled in."
              />
            </fieldset>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Changed your mind afterwards? Undo (Ctrl/Cmd+Z) puts everything
              back.
            </p>
          </AiDialogBody>
          <AiDialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>
              Back
            </Button>
            <Button size="sm" onClick={apply}>
              {mode === "replace" ? "Replace my content" : "Add to my resume"}
            </Button>
          </AiDialogFooter>
        </>
      )}
    </AiDialog>
  );
}

function ImportReview({ resume }: { resume: ImportedResume }) {
  const info = resume.personalInfo;
  const contacts = [info.email, info.phone, info.location].filter(Boolean);
  const found = importSummary(resume);

  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-sm font-semibold">
        {info.fullName || (
          <span className="text-muted-foreground">No name found</span>
        )}
      </p>
      {info.title && (
        <p className="text-xs text-muted-foreground">{info.title}</p>
      )}
      {contacts.length > 0 && (
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {contacts.join(" · ")}
        </p>
      )}
      {info.summary && (
        <p className="mt-2 line-clamp-3 text-xs">{info.summary}</p>
      )}
      {found.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {found.map((label) => (
            <li
              key={label}
              className="rounded-full bg-muted px-2 py-0.5 text-[11px]"
            >
              {label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          No sections were found — only the header above. Check that this is the
          right file.
        </p>
      )}
    </div>
  );
}

function ModeOption({
  checked,
  onSelect,
  title,
  hint,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  hint: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-2.5 rounded-md border p-2.5 transition-colors",
        checked ? "border-primary bg-primary/5" : "hover:bg-muted/50",
      )}
    >
      <input
        type="radio"
        name="import-mode"
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 h-3.5 w-3.5 accent-primary"
      />
      <span>
        <span className="block text-[13px] font-medium">{title}</span>
        <span className="block text-[11px] leading-snug text-muted-foreground">
          {hint}
        </span>
      </span>
    </label>
  );
}
