"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import {
  Download,
  FileText,
  LayoutTemplate,
  ListChecks,
  Rows3,
  Moon,
  Minus,
  Plus,
  Plus as PlusIcon,
  Printer,
  SlidersHorizontal,
  Redo2,
  RotateCcw,
  Sun,
  Undo2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useStore } from "zustand";

interface BuilderToolbarProps {
  showPdf?: boolean;
  onTogglePdf?: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onDownloadAts: () => void;
  /** "fit" or a scale factor. */
  zoom: "fit" | number;
  fitScale: number;
  onZoom: (zoom: "fit" | number) => void;
  /** Opens the properties drawer; only reachable below the lg breakpoint. */
  onOpenPanel: () => void;
  mode: "design" | "content" | "arrange";
  onMode: (mode: "design" | "content" | "arrange") => void;
  isDownloading: boolean;
}

export function BuilderToolbar({
  onPrint,
  onDownload,
  onDownloadAts,
  isDownloading,
  zoom,
  fitScale,
  onZoom,
  onOpenPanel,
  mode,
  onMode,
}: BuilderToolbarProps) {
  const addCustomSection = useResumeStore((s) => s.addCustomSection);
  const resetResume = useResumeStore((s) => s.resetResume);
  const { theme, setTheme } = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);

  const { undo, redo, pastStates, futureStates } = useStore(
    useResumeStore.temporal,
  );
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Let the browser handle undo inside text editors; ours applies after commit.
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA")
      )
        return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  return (
    <div
      data-editor-only
      className="p-2 sm:p-3 border-b flex flex-wrap items-center gap-1.5 bg-card sticky top-0 z-30"
    >
      <Button
        variant="ghost"
        size="icon-sm"
        title="Undo (Cmd/Ctrl+Z)"
        onClick={() => undo()}
        disabled={!canUndo}
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        title="Redo (Cmd/Ctrl+Shift+Z)"
        onClick={() => redo()}
        disabled={!canRedo}
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      <span className="mx-1 h-5 w-px bg-border" />

      {/* Three ways to work on the same document: lay it out, write it, or
          restructure it. Writing and restructuring are what a phone can
          actually do well. */}
      <div className="flex items-center rounded-md border p-0.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            onClick={() => onMode(m.id)}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
              mode === m.id
                ? "bg-muted font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <m.icon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{m.label}</span>
          </button>
        ))}
      </div>

      {mode === "design" && (
        <>
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <span className="hidden sm:flex">
            <ZoomControl zoom={zoom} fitScale={fitScale} onZoom={onZoom} />
          </span>
        </>
      )}

      {mode !== "arrange" && (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          title="Add a custom section"
          onClick={() => addCustomSection()}
        >
          <Plus className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Section</span>
        </Button>
      )}

      {/* Everything about how the document looks lives in the properties
          panel, so the bar keeps only document-wide actions. */}
      <span className="ml-auto flex items-center gap-1.5">
        <Popover open={confirmReset} onOpenChange={setConfirmReset}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" title="Start over">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 space-y-2" align="end">
            <p className="text-xs">
              Reset the resume to the sample content? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  resetResume();
                  setConfirmReset(false);
                }}
              >
                Reset
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon-sm"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 lg:hidden", mode !== "design" && "hidden")}
          title="Design and sections"
          onClick={onOpenPanel}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Design</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          title="Print"
          onClick={onPrint}
        >
          <Printer className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Print</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          title="Plain-text copy for applicant tracking systems, which parse multi-column PDFs poorly"
          onClick={onDownloadAts}
        >
          <FileText className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">ATS</span>
        </Button>
        <Button
          size="sm"
          className="h-8"
          title="Save as PDF"
          onClick={onDownload}
          disabled={isDownloading}
        >
          <Download className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Download</span>
        </Button>
      </span>
    </div>
  );
}

const MODES = [
  {
    id: "design" as const,
    label: "Design",
    icon: LayoutTemplate,
    hint: "Lay out and style the page",
  },
  {
    id: "content" as const,
    label: "Content",
    icon: ListChecks,
    hint: "Write and edit your details",
  },
  {
    id: "arrange" as const,
    label: "Arrange",
    icon: Rows3,
    hint: "Reorder and move sections",
  },
];

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5];

/** Paged documents need a zoom that is not just fit-to-width. */
function ZoomControl({
  zoom,
  fitScale,
  onZoom,
}: {
  zoom: "fit" | number;
  /** What "fit" currently resolves to, so stepping from it moves sensibly. */
  fitScale: number;
  onZoom: (zoom: "fit" | number) => void;
}) {
  const label = zoom === "fit" ? "Fit" : `${Math.round(zoom * 100)}%`;
  const step = (delta: number) => {
    // "Fit" is not a rung on the ladder, so resolve it to the scale it
    // currently produces before looking for the next step.
    const current = zoom === "fit" ? fitScale : zoom;
    const next =
      delta > 0
        ? ZOOM_LEVELS.find((l) => l > current + 0.001)
        : [...ZOOM_LEVELS].reverse().find((l) => l < current - 0.001);
    if (next) onZoom(next);
  };

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        title="Zoom out"
        onClick={() => step(-1)}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-14 tabular-nums text-xs"
            title="Zoom"
          >
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onZoom("fit")}>
            Fit to width
          </DropdownMenuItem>
          {ZOOM_LEVELS.map((level) => (
            <DropdownMenuItem key={level} onClick={() => onZoom(level)}>
              {Math.round(level * 100)}%
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon-sm"
        title="Zoom in"
        onClick={() => step(1)}
      >
        <PlusIcon className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
