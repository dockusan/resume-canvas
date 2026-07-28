"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { SectionConfig } from "@/lib/types";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  EyeOff,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { StylePopover } from "./style-toolbar";

const TWO_COL_TEMPLATES = ["classic", "modern-2col", "creative"];

function ChromeButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800"
    >
      {children}
    </button>
  );
}

/** Hover action bar for a section: move / style / hide / duplicate / delete. */
export function SectionChrome({ section }: { section: SectionConfig }) {
  const template = useResumeStore((s) => s.settings.template);
  const moveSection = useResumeStore((s) => s.moveSection);
  const toggleSectionVisibility = useResumeStore(
    (s) => s.toggleSectionVisibility,
  );
  const duplicateSection = useResumeStore((s) => s.duplicateSection);
  const removeSectionFromLayout = useResumeStore(
    (s) => s.removeSectionFromLayout,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const twoCol = TWO_COL_TEMPLATES.includes(template);

  return (
    <div
      className="absolute -top-3 right-0 z-20 flex items-center gap-0 bg-white border border-gray-200 rounded-md shadow-md p-1 opacity-0 group-hover/section:opacity-100 focus-within:opacity-100 transition-opacity"
      contentEditable={false}
    >
      <ChromeButton
        title="Move up"
        onClick={() => moveSection(section.id, "up")}
      >
        <ArrowUp className="w-4 h-4" />
      </ChromeButton>
      <ChromeButton
        title="Move down"
        onClick={() => moveSection(section.id, "down")}
      >
        <ArrowDown className="w-4 h-4" />
      </ChromeButton>
      {twoCol && (
        <>
          <ChromeButton
            title="Move to left column"
            onClick={() => moveSection(section.id, "left")}
          >
            <ArrowLeft className="w-4 h-4" />
          </ChromeButton>
          <ChromeButton
            title="Move to right column"
            onClick={() => moveSection(section.id, "right")}
          >
            <ArrowRight className="w-4 h-4" />
          </ChromeButton>
        </>
      )}
      <StylePopover path={section.id} label={`Style — ${section.name}`}>
        <button
          type="button"
          title="Section styling"
          className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800"
        >
          <Settings className="w-4 h-4" />
        </button>
      </StylePopover>
      <ChromeButton
        title="Hide section"
        onClick={() => toggleSectionVisibility(section.id)}
      >
        <EyeOff className="w-4 h-4" />
      </ChromeButton>
      <ChromeButton
        title="Duplicate section"
        onClick={() => duplicateSection(section.id)}
      >
        <Copy className="w-4 h-4" />
      </ChromeButton>
      <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Delete section"
            className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 space-y-2" align="end">
          <p className="text-xs">
            Remove “{section.name}” from the resume?
            {!section.id.startsWith("custom:") &&
              " Its content is kept and can be restored from the toolbar."}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                removeSectionFromLayout(section.id);
                setConfirmOpen(false);
              }}
            >
              Remove
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
