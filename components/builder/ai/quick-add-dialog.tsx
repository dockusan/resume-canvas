"use client";

import { FieldInput } from "@/components/builder/content/field-input";
import { useEditing } from "@/components/builder/inline/editing-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { draftToItem } from "@/lib/ai/apply";
import { draftSection, useAiDialogs } from "@/lib/ai/client";
import { MAX_OVERVIEW_CHARS } from "@/lib/ai/limits";
import { QuickAddDraft, QuickAddSection } from "@/lib/ai/types";
import { SECTION_FORMS } from "@/lib/schema/form-fields";
import { useDocument } from "@/lib/schema/use-document";
import {
  DEFAULT_SECTION_NAMES,
  SectionKey,
  isCustomSectionId,
  resumeStore,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { CustomSectionItem } from "@/lib/types";
import { Lightbulb, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { AiDialog, AiDialogBody, AiDialogFooter, AiError } from "./ai-dialog";

/** Built-in sections quick add can write to, in the order they're offered. */
const BUILTIN_TARGETS = [
  "experience",
  "education",
  "projects",
  "skills",
  "certifications",
  "languages",
  "strengths",
  "summary",
] as const;

const NEW_SECTION = "new";

const PLACEHOLDERS: Record<string, string> = {
  auto: "e.g. Backend engineer at Grab since Jan 2021, Ho Chi Minh City. Built the payment reconciliation service in Go, cut manual checks by 80%, led a team of 4.",
  experience:
    "e.g. Backend engineer at Grab since Jan 2021, Ho Chi Minh City. Built the payment reconciliation service in Go, cut manual checks by 80%, led a team of 4.",
  education:
    "e.g. BSc Computer Science, HCMC University of Technology, 2015–2019, GPA 3.6/4.",
  projects:
    "e.g. Open-source CLI in Rust that syncs dotfiles across machines, 2k GitHub stars, github.com/you/dotsync, 2023.",
  skills: "e.g. Go, Java, PostgreSQL, Kafka, Kubernetes, AWS, system design",
  certifications: "e.g. AWS Solutions Architect – Associate, 2023",
  languages:
    "e.g. Vietnamese native, English fluent (IELTS 7.5), basic Japanese",
  strengths:
    "e.g. I turn vague requirements into plans people can follow, and I like mentoring juniors.",
  summary:
    "e.g. 6 years of backend work in fintech, mostly Go and Java, payments and reconciliation; looking for a staff role.",
  custom:
    "e.g. 1st prize, Vietnam Hackathon 2022 — built a fraud-detection demo with a team of 3.",
};

type Item = { id: string } & Record<string, unknown>;

/**
 * Quick add: describe something in a sentence or two and get it back as
 * finished resume entries, ready to edit and drop into a section.
 */
export function QuickAddDialog() {
  const initial = useAiDialogs((s) => s.quickAdd);
  // Keyed on the requested section so each opening starts fresh.
  return initial === null ? null : (
    <QuickAddFlow key={initial} initial={initial} />
  );
}

function QuickAddFlow({ initial }: { initial: string }) {
  const close = useAiDialogs((s) => s.close);
  const doc = useDocument();
  const { setActivePath } = useEditing();
  const currentSummary = useResumeStore(
    (s) => s.resumeData.personalInfo.summary,
  );
  const insertItems = useResumeStore((s) => s.insertItems);
  const addCustomSection = useResumeStore((s) => s.addCustomSection);
  const setPersonalInfo = useResumeStore((s) => s.setPersonalInfo);

  // Every section that can take an entry: the built-ins (whether or not they
  // are on the page yet) and the custom sections that exist.
  const titleOf = (id: string) =>
    doc.sections.find((s) => s.id === id)?.title ??
    DEFAULT_SECTION_NAMES[id] ??
    id;
  const targets = [
    { id: "auto", label: "Let AI choose" },
    ...BUILTIN_TARGETS.map((id) => ({ id, label: titleOf(id) })),
    ...doc.sections
      .filter((s) => isCustomSectionId(s.id))
      .map((s) => ({ id: s.id, label: s.title })),
    { id: NEW_SECTION, label: "A new section" },
  ];

  const [target, setTarget] = useState(
    targets.some((t) => t.id === initial) ? initial : "auto",
  );
  const [text, setText] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuickAddDraft | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState("");
  const [newTitle, setNewTitle] = useState("");

  /** What the server is asked to write: a built-in type, custom, or auto. */
  const requested: QuickAddSection | "auto" =
    target === "auto"
      ? "auto"
      : target === NEW_SECTION || isCustomSectionId(target)
        ? "custom"
        : (target as QuickAddSection);

  const run = async () => {
    if (!text.trim() || drafting) return;
    setDrafting(true);
    setError(null);
    try {
      const next = await draftSection({
        text,
        target: requested,
        sectionTitle: isCustomSectionId(target) ? titleOf(target) : undefined,
      });
      setDraft(next);
      setItems(
        next.items.map((d) => ({
          id: uuidv4(),
          ...draftToItem(next.section, d),
        })),
      );
      setSummary(next.summary);
      setNewTitle(next.sectionTitle || "New Section");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't draft that.");
    } finally {
      setDrafting(false);
    }
  };

  /** Where the draft lands: an existing section id, or a new custom one. */
  const destination = !draft
    ? null
    : isCustomSectionId(target)
      ? target
      : draft.section === "custom"
        ? NEW_SECTION
        : draft.section;

  const insert = () => {
    if (!draft || !destination) return;
    // The store gives every inserted item a fresh id; these were only keys.
    const rows: Record<string, unknown>[] = items;
    let sectionId: string;
    if (destination === "summary") {
      setPersonalInfo({ summary });
      // The summary is a header field, not a list, so bring its section
      // onto the page by hand: restore it if removed, show it if hidden.
      resumeStore().getState().restoreSection("summary");
      const { settings, toggleSectionVisibility } = resumeStore().getState();
      const config = [...settings.leftColumn, ...settings.rightColumn].find(
        (s) => s.id === "summary",
      );
      if (config && !config.visible) toggleSectionVisibility("summary");
      sectionId = "summary";
    } else if (destination === NEW_SECTION) {
      sectionId = addCustomSection(
        newTitle.trim() || "New Section",
        rows as Omit<CustomSectionItem, "id">[],
      );
    } else {
      insertItems(destination as SectionKey, rows);
      sectionId = destination;
    }
    close();
    setActivePath(sectionId);
  };

  const formType =
    destination &&
    destination !== NEW_SECTION &&
    !isCustomSectionId(destination)
      ? (destination as keyof typeof SECTION_FORMS)
      : "custom";
  // Icons are a design choice made on the page, not part of the draft.
  const fields = SECTION_FORMS[formType].fields.filter(
    (f) => f.type !== "icon",
  );
  const canInsert =
    destination === "summary" ? Boolean(summary.trim()) : items.length > 0;

  return (
    <AiDialog
      open
      title="Quick add with AI"
      description={
        draft
          ? "Check the draft and edit anything that's off before adding it."
          : "Describe it in your own words — a job, a degree, a project, a list of skills. AI turns it into polished entries."
      }
      onClose={close}
    >
      {!draft ? (
        <>
          <AiDialogBody>
            <label className="text-[11px] font-medium text-muted-foreground">
              Add to
            </label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="mt-1.5 h-9 w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targets.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="mt-4 block text-[11px] font-medium text-muted-foreground">
              In your own words
            </label>
            <Textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run();
              }}
              maxLength={MAX_OVERVIEW_CHARS}
              rows={5}
              disabled={drafting}
              placeholder={PLACEHOLDERS[requested] ?? PLACEHOLDERS.auto}
              className="mt-1.5 max-h-60 text-sm"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Any language works. Facts and numbers you give are kept; nothing
              is made up. Sent to an AI model via OpenRouter, not stored.
            </p>

            <AiError message={error} />
          </AiDialogBody>
          <AiDialogFooter>
            <Button variant="outline" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button size="sm" onClick={run} disabled={!text.trim() || drafting}>
              {drafting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              )}
              {drafting ? "Drafting…" : "Draft it"}
            </Button>
          </AiDialogFooter>
        </>
      ) : (
        <>
          <AiDialogBody>
            {destination === NEW_SECTION ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">
                  New section heading
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Adding to{" "}
                <span className="font-medium text-foreground">
                  {titleOf(destination ?? "")}
                </span>
              </p>
            )}

            {destination === "summary" ? (
              <div className="mt-3 space-y-1.5">
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={5}
                  className="text-sm"
                />
                {currentSummary && (
                  <p className="text-[11px] text-muted-foreground">
                    This replaces your current summary.
                  </p>
                )}
              </div>
            ) : destination === "skills" ? (
              <SkillChips items={items} onChange={setItems} />
            ) : (
              <div className="mt-3 space-y-3">
                {items.map((item) => (
                  <DraftCard
                    key={item.id}
                    item={item}
                    fields={fields}
                    onChange={(patch) =>
                      setItems((all) =>
                        all.map((it) =>
                          it.id === item.id ? { ...it, ...patch } : it,
                        ),
                      )
                    }
                    onRemove={
                      items.length > 1
                        ? () =>
                            setItems((all) =>
                              all.filter((it) => it.id !== item.id),
                            )
                        : undefined
                    }
                  />
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nothing could be drafted from that. Go back and add a bit
                    more detail.
                  </p>
                )}
              </div>
            )}

            {draft.suggestions.length > 0 && (
              <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                  To make it stronger
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[12px] text-muted-foreground">
                  {draft.suggestions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Add the answers to your description and draft again, or fill
                  them in above.
                </p>
              </div>
            )}

            <AiError message={error} />
          </AiDialogBody>
          <AiDialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="mr-auto"
              onClick={() => setDraft(null)}
            >
              Back
            </Button>
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
              onClick={insert}
              disabled={!canInsert || drafting}
            >
              Add to resume
            </Button>
          </AiDialogFooter>
        </>
      )}
    </AiDialog>
  );
}

function DraftCard({
  item,
  fields,
  onChange,
  onRemove,
}: {
  item: Item;
  fields: (typeof SECTION_FORMS)[keyof typeof SECTION_FORMS]["fields"];
  onChange: (patch: Record<string, unknown>) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="relative rounded-md border bg-background p-3">
      {onRemove && (
        <button
          type="button"
          title="Leave this one out"
          onClick={onRemove}
          className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.key}
            className={field.half ? "sm:col-span-1" : "pr-6 sm:col-span-2"}
          >
            <FieldInput field={field} item={item} onChange={onChange} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A form per skill would be a wall of one-word inputs; chips read better. */
function SkillChips({
  items,
  onChange,
}: {
  items: Item[];
  onChange: (items: Item[]) => void;
}) {
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-1 rounded-full border bg-background py-0.5 pl-2.5 pr-1 text-xs"
        >
          {String(item.name)}
          <button
            type="button"
            aria-label={`Remove ${String(item.name)}`}
            onClick={() => onChange(items.filter((it) => it.id !== item.id))}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}
