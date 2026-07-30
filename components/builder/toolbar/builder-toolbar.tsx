"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ShareDialog } from "./share-dialog";
import Image from "next/image";
import Link from "next/link";
import { SaveStatus } from "./save-status";
import { resumeStore, useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import {
  Download,
  FileText,
  LayoutTemplate,
  ListChecks,
  MoreHorizontal,
  Rows3,
  Share2,
  SquarePlus,
  Moon,
  Minus,
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
  /** Length of the finished document, shown as a badge. */
  pageCount: number;
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
  pageCount,
}: BuilderToolbarProps) {
  const addCustomSection = useResumeStore((s) => s.addCustomSection);
  const resetResume = useResumeStore((s) => s.resetResume);
  const { theme, setTheme } = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const { undo, redo, pastStates, futureStates } = useStore(
    resumeStore().temporal,
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
      className="sticky top-0 z-30 flex items-center gap-1.5 border-b bg-card px-2 py-2 sm:px-3"
    >
      {/* Left: identity and history. */}
      <Link
        href="/"
        title="Resume Canvas home"
        className="mr-1 flex shrink-0 items-center gap-1.5 rounded-md px-1 py-1 hover:bg-muted"
      >
        <Image
          src="/favicon.ico"
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 rounded-[4px]"
        />
        <span className="hidden text-sm font-semibold xl:inline">
          Resume Canvas
        </span>
      </Link>

      <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
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
      </div>

      {/* Centre: the primary navigation — which way you are working. */}
      <div className="mx-auto flex items-center rounded-lg border bg-muted/40 p-0.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            aria-pressed={mode === m.id}
            onClick={() => onMode(m.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors sm:px-3",
              mode === m.id
                ? "bg-background font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <m.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Right: status, then output. */}
      <span className="flex shrink-0 items-center gap-1.5">
        {mode === "design" && (
          <>
            <span
              className="hidden rounded-md bg-muted px-2 py-1 text-[11px] tabular-nums text-muted-foreground md:inline"
              title="Length of the finished resume"
            >
              {pageCount} {pageCount === 1 ? "page" : "pages"}
            </span>
            <SaveStatus />
            <span className="hidden sm:flex">
              <ZoomControl zoom={zoom} fitScale={fitScale} onZoom={onZoom} />
            </span>
          </>
        )}

        {/* A divider and a label keep this from reading as a second zoom-in
            button, which is what a bare "+" beside the zoom stepper does. */}
        {mode !== "arrange" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              title="Add a custom section"
              onClick={() => addCustomSection()}
            >
              <SquarePlus className="h-3.5 w-3.5 md:mr-1" />
              <span className="hidden md:inline">Section</span>
            </Button>
          </>
        )}

        {mode === "design" && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 lg:hidden"
            title="Design and sections"
            onClick={onOpenPanel}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" title="More">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
              {theme === "dark" ? "Light appearance" : "Dark appearance"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPrint}>
              <Printer className="h-3.5 w-3.5" /> Print
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownloadAts}>
              <FileText className="h-3.5 w-3.5" /> Plain text for ATS
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Start over
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          className="h-8"
          title="Share a read-only link"
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Share</span>
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

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />

      <ConfirmDialog
        open={confirmReset}
        title="Start over?"
        description="This replaces everything with the sample resume. Your current content cannot be recovered."
        confirmLabel="Start over"
        destructive
        onConfirm={() => {
          resetResume();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
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
    <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
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
