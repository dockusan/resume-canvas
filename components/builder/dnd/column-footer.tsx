"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ColumnKey } from "@/lib/pagination/distribute";
import { Placement } from "@/lib/schema/document";
import { useDocument } from "@/lib/schema/use-document";
import {
  DEFAULT_SECTION_NAMES,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useSectionDnd } from "./section-dnd";

/** Below this there isn't a usable amount of room, so we stay quiet. */
const MIN_FREE_SPACE = 70;

/**
 * The affordance that fills leftover space at the foot of a column: drop a
 * dragged section here, or add one outright. Without it, the blank half of a
 * short column is dead space with nothing to click.
 */
export function ColumnFooter({
  column,
  page,
  freeSpace,
  index,
}: {
  column: ColumnKey;
  page: number;
  freeSpace: number;
  index: number;
}) {
  const doc = useDocument();
  const { active } = useSectionDnd();
  const settings = useResumeStore((s) => s.settings);
  const toggleVisibility = useResumeStore((s) => s.toggleSectionVisibility);
  const restoreSection = useResumeStore((s) => s.restoreSection);
  const addCustomSection = useResumeStore((s) => s.addCustomSection);
  const moveSectionTo = useResumeStore((s) => s.moveSectionTo);

  if (freeSpace < MIN_FREE_SPACE && !active) return null;

  const all = [...settings.leftColumn, ...settings.rightColumn];
  const hidden = all.filter((s) => !s.visible);
  const removed = Object.keys(DEFAULT_SECTION_NAMES).filter(
    (id) => !all.some((s) => s.id === id),
  );

  const place = (sectionId: string) => {
    moveSectionTo(sectionId, {
      column: (column === "full" ? "full" : column) as Placement,
      index,
      page: page === 0 ? "auto" : page,
    });
  };

  // The footer lives inside the page box, so it must fit in the room the
  // paginator actually left — including its own top margin, or the dashed box
  // spills past the sheet edge and gets clipped.
  const MARGIN = 8;
  const available = Math.max(0, freeSpace - MARGIN);

  return (
    <div
      data-editor-only
      className="mt-2"
      style={{ height: Math.min(available, 120) }}
    >
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full h-full rounded-md border border-dashed",
              "flex items-center justify-center gap-1.5 text-[11px]",
              "opacity-25 hover:opacity-70 transition-opacity",
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Add section here
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="center">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            Add to this column
          </div>
          {hidden.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                toggleVisibility(s.id);
                place(s.id);
              }}
              className="w-full text-left text-xs rounded px-2 py-1.5 hover:bg-muted"
            >
              {s.name}
            </button>
          ))}
          {removed.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                restoreSection(id);
                place(id);
              }}
              className="w-full text-left text-xs rounded px-2 py-1.5 hover:bg-muted"
            >
              {DEFAULT_SECTION_NAMES[id]}
            </button>
          ))}
          {doc.sections
            .filter((s) => s.visible)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => place(s.id)}
                className="w-full text-left text-xs rounded px-2 py-1.5 hover:bg-muted text-muted-foreground"
              >
                Move “{s.title}” here
              </button>
            ))}
          <div className="border-t mt-1 pt-1">
            <button
              type="button"
              onClick={() => {
                const id = addCustomSection();
                place(id);
              }}
              className="w-full text-left text-xs rounded px-2 py-1.5 hover:bg-muted flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> New custom section
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
