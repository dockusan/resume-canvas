"use client";

import { useEditing } from "@/components/builder/inline/editing-context";
import { useDocument } from "@/lib/schema/use-document";
import {
  DEFAULT_SECTION_NAMES,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Plus, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Group } from "./controls";

/**
 * The document's sections at a glance.
 *
 * Shown when nothing is selected, where the panel used to sit empty telling
 * you to go click something. It doubles as the home for hidden and removed
 * sections, which were previously only reachable from a dropdown in the top
 * bar that gave no hint they existed.
 */
export function SectionsOutline() {
  const doc = useDocument();
  const { setActivePath } = useEditing();
  const settings = useResumeStore((s) => s.settings);
  const toggleVisibility = useResumeStore((s) => s.toggleSectionVisibility);
  const restoreSection = useResumeStore((s) => s.restoreSection);
  const addCustomSection = useResumeStore((s) => s.addCustomSection);
  const moveSection = useResumeStore((s) => s.moveSection);

  const all = [...settings.leftColumn, ...settings.rightColumn];
  const removed = Object.keys(DEFAULT_SECTION_NAMES).filter(
    (id) => !all.some((s) => s.id === id),
  );
  const twoCol = doc.layout.columns === 2;

  const ordered = [...doc.sections].sort((a, b) => {
    const col = (n: typeof a) => (n.placement.column === "right" ? 1 : 0);
    return col(a) - col(b) || a.placement.order - b.placement.order;
  });

  return (
    <div className="px-3">
      <Group title="Sections">
        <div className="space-y-0.5">
          {ordered.map((node) => (
            <div
              key={node.id}
              className={cn(
                "group flex items-center gap-1 rounded px-1 py-1 hover:bg-muted",
                !node.visible && "opacity-50",
              )}
            >
              <button
                type="button"
                onClick={() => setActivePath(node.id)}
                className="flex-1 min-w-0 text-left text-[13px] truncate"
                title="Select this section"
              >
                {node.title}
              </button>
              {twoCol && (
                <span className="text-[10px] uppercase text-muted-foreground shrink-0">
                  {node.placement.column === "right" ? "R" : "L"}
                </span>
              )}
              <span className="flex shrink-0 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  title="Move up"
                  onClick={() => moveSection(node.id, "up")}
                  className="h-5 w-5 rounded hover:bg-background flex items-center justify-center"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  title="Move down"
                  onClick={() => moveSection(node.id, "down")}
                  className="h-5 w-5 rounded hover:bg-background flex items-center justify-center"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </span>
              <Switch
                checked={node.visible}
                onCheckedChange={() => toggleVisibility(node.id)}
                aria-label={
                  node.visible ? `Hide ${node.title}` : `Show ${node.title}`
                }
                className="shrink-0"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setActivePath(addCustomSection())}
          className="w-full mt-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed px-2 py-1.5 text-[13px] hover:bg-muted"
        >
          <Plus className="w-3 h-3" /> Add a section
        </button>
      </Group>

      {removed.length > 0 && (
        <Group title="Removed">
          {removed.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => restoreSection(id)}
              className="w-full flex items-center gap-1.5 rounded px-1 py-1 text-[13px] hover:bg-muted"
            >
              <RotateCcw className="w-3 h-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{DEFAULT_SECTION_NAMES[id]}</span>
            </button>
          ))}
        </Group>
      )}

      <Group title="Header">
        <button
          type="button"
          onClick={() => setActivePath("personalInfo")}
          className="w-full text-left text-[13px] rounded px-1 py-1 hover:bg-muted"
        >
          Name, contacts and photo
        </button>
      </Group>
    </div>
  );
}
