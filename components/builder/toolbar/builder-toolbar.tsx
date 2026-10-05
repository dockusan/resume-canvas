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
import { downloadBackup, importBackup } from "@/lib/export/backup";
import {
  ChevronDown,
  Download,
  FileDown,
  FileJson,
  FileText,
  FileType,
  ShieldCheck,
  Home,
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
  Upload,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";

interface BuilderToolbarProps {
  showPdf?: boolean;
  onTogglePdf?: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onDownloadAts: () => void;
  /** Single-column PDF through the Clean template, for job portals. */
  onDownloadAtsPdf: () => void;
  onDownloadDocx: () => void;
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
  onDownloadAtsPdf,
  onDownloadDocx,
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
  const [pendingImport, setPendingImport] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);

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
      {/* Left: identity and history. Below sm the mark gives way to the
          controls; "Home" moves into the overflow menu rather than vanishing. */}
      <Link
        href="/"
        title="Resume Canvas home"
        className="mr-1 hidden shrink-0 items-center gap-1.5 rounded-md px-1 py-1 hover:bg-muted sm:flex"
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

      <div className="flex shrink-0 items-center rounded-lg border bg-muted/40 p-0.5">
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

      {/* Centre: the primary navigation — which way you are working.
          A flex-1 track rather than `mx-auto`: auto margins keep demanding
          their share of a row that has none left, which pushed the output
          buttons off the right edge instead of letting the row adapt. */}
      <div className="flex min-w-0 flex-1 justify-center">
        <div className="flex shrink-0 items-center rounded-lg border bg-muted/40 p-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              title={m.hint}
              aria-pressed={mode === m.id}
              onClick={() => onMode(m.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-4 py-2.5 text-xs transition-colors md:px-3",
                mode === m.id
                  ? "bg-background font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <m.icon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{m.label}</span>
            </button>
          ))}
        </div>
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
            <span className="hidden md:flex">
              <ZoomControl zoom={zoom} fitScale={fitScale} onZoom={onZoom} />
            </span>
          </>
        )}

        {/* A divider and a label keep this from reading as a second zoom-in
            button, which is what a bare "+" beside the zoom stepper does. */}
        {mode !== "arrange" && (
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 md:inline-flex"
            title="Add a custom section"
            onClick={() => addCustomSection()}
          >
            <SquarePlus className="h-3.5 w-3.5 md:mr-1" />
            <span className="hidden md:inline">Section</span>
          </Button>
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
            {/* Whatever the row could not fit reappears here rather than
                becoming unreachable, so every action has a home at any width. */}
            <DropdownMenuItem
              className="md:hidden"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-3.5 w-3.5" /> Share a link
            </DropdownMenuItem>
            {mode !== "arrange" && (
              <DropdownMenuItem
                className="md:hidden"
                onClick={() => addCustomSection()}
              >
                <SquarePlus className="h-3.5 w-3.5" /> Add a section
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="md:hidden" />
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
            <DropdownMenuItem asChild className="sm:hidden">
              <Link href="/">
                <Home className="h-3.5 w-3.5" /> Resume Canvas home
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => downloadBackup()}>
              <FileJson className="h-3.5 w-3.5" /> Export resume file
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => importInput.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Import resume file
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
          className="hidden h-8 md:inline-flex"
          title="Share a read-only link"
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="h-3.5 w-3.5 lg:mr-1" />
          <span className="hidden lg:inline">Share</span>
        </Button>

        {/* Never collapses into the overflow menu: exporting is the point of
            the app, and it has to be one tap away on the smallest phone. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="h-8"
              title="Download"
              disabled={isDownloading}
            >
              <Download className="h-3.5 w-3.5 lg:mr-1" />
              <span className="hidden lg:inline">Download</span>
              <ChevronDown className="h-3 w-3 opacity-70 hidden lg:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DownloadItem
              icon={<FileDown className="h-4 w-4" />}
              label="PDF"
              hint="Exactly as designed. Best for email and referrals."
              onClick={onDownload}
            />
            <DownloadItem
              icon={<ShieldCheck className="h-4 w-4" />}
              label="ATS-safe PDF"
              hint="Same content in one clean column, for job portals."
              onClick={onDownloadAtsPdf}
            />
            <DownloadItem
              icon={<FileType className="h-4 w-4" />}
              label="Word (.docx)"
              hint="For portals and recruiters that ask for Word."
              onClick={onDownloadDocx}
            />
            <DownloadItem
              icon={<FileText className="h-4 w-4" />}
              label="Plain text"
              hint="To paste into application forms."
              onClick={onDownloadAts}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </span>

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />

      {/* Moves a resume between browsers: localStorage is per browser. */}
      <input
        ref={importInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) setPendingImport(file);
        }}
      />
      <ConfirmDialog
        open={pendingImport !== null}
        title="Import this resume?"
        description={
          importError ??
          "This replaces the resume in this browser with the one in the file. Export yours first if you want to keep it."
        }
        confirmLabel="Import"
        destructive
        onConfirm={async () => {
          if (!pendingImport) return;
          try {
            await importBackup(pendingImport);
          } catch (err) {
            setImportError(
              err instanceof Error ? err.message : "Couldn't read that file.",
            );
          }
        }}
        onCancel={() => {
          setPendingImport(null);
          setImportError(null);
        }}
      />

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

function DownloadItem({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem onClick={onClick} className="items-start gap-2.5 py-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="flex flex-col">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="text-[11px] text-muted-foreground leading-snug">
          {hint}
        </span>
      </span>
    </DropdownMenuItem>
  );
}
