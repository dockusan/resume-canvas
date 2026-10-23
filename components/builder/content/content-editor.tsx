"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toPlainText } from "@/lib/richtext/runs";
import { PERSONAL_FORM, SECTION_FORMS } from "@/lib/schema/form-fields";
import { SectionNode } from "@/lib/schema/document";
import { useDocument } from "@/lib/schema/use-document";
import {
  SectionKey,
  customSectionUuid,
  isCustomSectionId,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { useAiDialogs, useAiEnabled } from "@/lib/ai/client";
import {
  ChevronDown,
  Copy,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useId, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { FieldInput } from "./field-input";

type Item = { id: string } & Record<string, unknown>;

/**
 * A shared constant, not a fresh `[]` per call: a zustand selector that
 * allocates on every read never compares equal and re-renders forever.
 */
const NO_ITEMS: Item[] = [];

/**
 * Form-based editing for the resume's content.
 *
 * The page is the right place to fine-tune wording in context; it is the wrong
 * place to type a resume from scratch on a phone. This edits the same store,
 * so anything changed here shows up on the page immediately and vice versa.
 */
export function ContentEditor() {
  const doc = useDocument();
  const [open, setOpen] = useState<string | null>("personalInfo");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-2 p-3 sm:p-6">
      <PersonalCard
        open={open === "personalInfo"}
        onToggle={() =>
          setOpen(open === "personalInfo" ? null : "personalInfo")
        }
      />
      {doc.sections.map((node) => (
        <SectionCard
          key={node.id}
          node={node}
          open={open === node.id}
          onToggle={() => setOpen(open === node.id ? null : node.id)}
        />
      ))}
    </div>
  );
}

function CardShell({
  title,
  subtitle,
  open,
  onToggle,
  actions,
  dimmed,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border bg-card", dimmed && "opacity-60")}>
      <div className="flex items-center gap-1 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 min-w-0 text-left"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{title}</span>
            {subtitle && (
              <span className="block truncate text-xs text-muted-foreground">
                {subtitle}
              </span>
            )}
          </span>
        </button>
        {actions}
      </div>
      {open && <div className="border-t px-3 py-3">{children}</div>}
    </div>
  );
}

function PersonalCard({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const info = useResumeStore((s) => s.resumeData.personalInfo);
  const setPersonalInfo = useResumeStore((s) => s.setPersonalInfo);
  const aiEnabled = useAiEnabled();
  const summaryId = useId();
  const openQuickAdd = useAiDialogs((s) => s.openQuickAdd);

  return (
    <CardShell
      title="Personal details"
      subtitle={toPlainText(info.fullName) || "Your name and contacts"}
      open={open}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PERSONAL_FORM.map((field) => (
          <div
            key={field.key}
            className={field.half ? "sm:col-span-1" : "sm:col-span-2"}
          >
            <FieldInput
              field={field}
              item={info as unknown as Record<string, unknown>}
              onChange={(patch) => setPersonalInfo(patch)}
            />
          </div>
        ))}
        <div className="sm:col-span-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor={summaryId}
              className="text-[11px] font-medium text-muted-foreground"
            >
              Professional summary
            </label>
            {aiEnabled && (
              <button
                type="button"
                onClick={() => openQuickAdd("summary")}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <Sparkles className="h-3 w-3" /> Write with AI
              </button>
            )}
          </div>
          <Textarea
            id={summaryId}
            key={info.summary}
            defaultValue={toPlainText(info.summary ?? "")}
            rows={4}
            className="text-sm"
            onBlur={(e) => {
              if (e.target.value !== toPlainText(info.summary ?? ""))
                setPersonalInfo({ summary: e.target.value });
            }}
          />
        </div>
      </div>
    </CardShell>
  );
}

function SectionCard({
  node,
  open,
  onToggle,
}: {
  node: SectionNode;
  open: boolean;
  onToggle: () => void;
}) {
  const form = SECTION_FORMS[node.type] ?? SECTION_FORMS.custom;
  const toggleVisibility = useResumeStore((s) => s.toggleSectionVisibility);
  const renameSection = useResumeStore((s) => s.renameSection);
  const addItem = useResumeStore((s) => s.addItem);
  const headingId = useId();
  const aiEnabled = useAiEnabled();
  const openQuickAdd = useAiDialogs((s) => s.openQuickAdd);
  const items = useResumeStore((s) => {
    if (node.type === "summary") return NO_ITEMS;
    if (isCustomSectionId(node.id)) {
      const uuid = customSectionUuid(node.id);
      return (s.resumeData.customSections.find((c) => c.id === uuid)?.items ??
        NO_ITEMS) as Item[];
    }
    return ((s.resumeData as unknown as Record<string, Item[]>)[node.id] ??
      NO_ITEMS) as Item[];
  });

  if (node.type === "summary") return null;

  const sectionKey = node.id as SectionKey;

  return (
    <CardShell
      title={node.title}
      subtitle={`${items.length} ${items.length === 1 ? form.itemNoun : form.itemNoun + "s"}`}
      open={open}
      onToggle={onToggle}
      dimmed={!node.visible}
      actions={
        <Switch
          checked={node.visible}
          onCheckedChange={() => toggleVisibility(node.id)}
          aria-label={
            node.visible
              ? `Hide ${node.title} from the resume`
              : `Show ${node.title} on the resume`
          }
          className="shrink-0"
        />
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label
            htmlFor={headingId}
            className="text-[11px] font-medium text-muted-foreground"
          >
            Section heading
          </label>
          <Input
            id={headingId}
            defaultValue={node.title}
            className="h-9 text-sm"
            onBlur={(e) => {
              if (e.target.value && e.target.value !== node.title)
                renameSection(node.id, e.target.value);
            }}
          />
        </div>

        {items.map((item, index) => (
          <ItemRow
            key={item.id}
            sectionKey={sectionKey}
            item={item}
            index={index}
            count={items.length}
            form={form}
          />
        ))}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => addItem(sectionKey)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add {form.itemNoun}
          </Button>
          {aiEnabled && node.type !== "socials" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => openQuickAdd(node.id)}
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" /> Quick add with AI
            </Button>
          )}
        </div>
      </div>
    </CardShell>
  );
}

function ItemRow({
  sectionKey,
  item,
  index,
  count,
  form,
}: {
  sectionKey: SectionKey;
  item: Item;
  index: number;
  count: number;
  form: (typeof SECTION_FORMS)[keyof typeof SECTION_FORMS];
}) {
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);
  const duplicateItem = useResumeStore((s) => s.duplicateItem);
  const reorderItem = useResumeStore((s) => s.reorderItem);
  const [open, setOpen] = useState(false);

  const title = toPlainText((item[form.titleKey] as string) ?? "");
  const subtitle = form.subtitleKey
    ? toPlainText((item[form.subtitleKey] as string) ?? "")
    : "";

  return (
    <div className="rounded-md border bg-background">
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 min-w-0 text-left"
        >
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <span className="min-w-0">
            <span className="block truncate text-sm">
              {title || <span className="text-muted-foreground">Untitled</span>}
            </span>
            {subtitle && (
              <span className="block truncate text-xs text-muted-foreground">
                {subtitle}
              </span>
            )}
          </span>
        </button>
        <button
          type="button"
          title="Move up"
          disabled={index === 0}
          onClick={() => reorderItem(sectionKey, index, index - 1)}
          className="flex h-7 w-7 items-center justify-center rounded text-xs hover:bg-muted disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          title="Move down"
          disabled={index === count - 1}
          onClick={() => reorderItem(sectionKey, index, index + 1)}
          className="flex h-7 w-7 items-center justify-center rounded text-xs hover:bg-muted disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          title="Duplicate"
          onClick={() => duplicateItem(sectionKey, item.id)}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Delete"
          onClick={() => removeItem(sectionKey, item.id)}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="grid grid-cols-1 gap-3 border-t px-3 py-3 sm:grid-cols-2">
          {form.fields.map((field) => (
            <div
              key={field.key}
              className={field.half ? "sm:col-span-1" : "sm:col-span-2"}
            >
              <FieldInput
                field={field}
                item={item}
                onChange={(patch) => updateItem(sectionKey, item.id, patch)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
