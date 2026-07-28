"use client";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { documentSizes } from "@/data/document-size";
import { fontFamilies } from "@/data/font-family";
import { fontSizes } from "@/data/font-size";
import {
  DEFAULT_SECTION_NAMES,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { ResumeSettings, TemplateType } from "@/lib/types";
import {
  Download,
  Eye,
  FileText,
  Layers,
  Moon,
  Palette,
  Plus,
  Printer,
  Redo2,
  RotateCcw,
  Sun,
  Undo2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useStore } from "zustand";

const TEMPLATES: { value: TemplateType; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "modern", label: "Modern" },
  { value: "modern-2col", label: "Modern 2-Column" },
  { value: "minimal", label: "Minimal" },
  { value: "executive", label: "Executive" },
  { value: "creative", label: "Creative" },
];

const BUILTIN_SECTION_IDS = Object.keys(DEFAULT_SECTION_NAMES);

interface BuilderToolbarProps {
  showPdf: boolean;
  onTogglePdf: () => void;
  onPrint: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}

export function BuilderToolbar({
  showPdf,
  onTogglePdf,
  onPrint,
  onDownload,
  isDownloading,
}: BuilderToolbarProps) {
  const settings = useResumeStore((s) => s.settings);
  const updateSettings = useResumeStore((s) => s.updateSettings);
  const addCustomSection = useResumeStore((s) => s.addCustomSection);
  const toggleSectionVisibility = useResumeStore(
    (s) => s.toggleSectionVisibility,
  );
  const restoreSection = useResumeStore((s) => s.restoreSection);
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

  const allSections = [...settings.leftColumn, ...settings.rightColumn];
  const hiddenSections = allSections.filter((s) => !s.visible);
  const removedBuiltins = BUILTIN_SECTION_IDS.filter(
    (id) => !allSections.some((s) => s.id === id),
  );
  const showPhotoHidden = settings.showPhoto === false;

  return (
    <div className="p-2 sm:p-3 border-b flex flex-wrap items-center gap-1.5 bg-card sticky top-0 z-30">
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

      <Select
        value={settings.template}
        onValueChange={(v) => updateSettings({ template: v as TemplateType })}
      >
        <SelectTrigger className="w-[150px] h-8" size="sm">
          <Layers className="h-3.5 w-3.5 opacity-60" />
          <SelectValue placeholder="Template" />
        </SelectTrigger>
        <SelectContent>
          {TEMPLATES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        // Older persisted values quote the family name ("'Khand', sans-serif");
        // fall back to a label match so the select still shows the right font.
        value={
          fontFamilies.find((f) => f.value === settings.fontFamily)?.value ??
          fontFamilies.find((f) =>
            settings.fontFamily
              ?.toLowerCase()
              .includes(f.label.toLowerCase()),
          )?.value
        }
        onValueChange={(v) => updateSettings({ fontFamily: v })}
      >
        <SelectTrigger className="w-[130px] h-8" size="sm">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {fontFamilies.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              <span style={{ fontFamily: f.value }}>{f.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={settings.fontSize}
        onValueChange={(v) =>
          updateSettings({ fontSize: v as ResumeSettings["fontSize"] })
        }
      >
        <SelectTrigger className="w-[110px] h-8" size="sm">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          {fontSizes.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={settings.documentSize}
        onValueChange={(v) =>
          updateSettings({ documentSize: v as ResumeSettings["documentSize"] })
        }
      >
        <SelectTrigger className="w-[90px] h-8" size="sm">
          <FileText className="h-3.5 w-3.5 opacity-60" />
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          {documentSizes.map((d) => (
            <SelectItem key={d.value} value={d.value}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8" title="Theme color">
            <Palette className="h-3.5 w-3.5" />
            <span
              className="w-3.5 h-3.5 rounded-full border"
              style={{ backgroundColor: settings.themeColor }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <ColorPicker
            value={settings.themeColor}
            onChange={(themeColor) => updateSettings({ themeColor })}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => addCustomSection()}
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Section
      </Button>

      {(hiddenSections.length > 0 ||
        removedBuiltins.length > 0 ||
        showPhotoHidden) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Eye className="h-3.5 w-3.5 mr-1" /> Restore
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {hiddenSections.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs">
                  Hidden sections
                </DropdownMenuLabel>
                {hiddenSections.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => toggleSectionVisibility(s.id)}
                  >
                    {s.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {removedBuiltins.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">
                  Removed sections
                </DropdownMenuLabel>
                {removedBuiltins.map((id) => (
                  <DropdownMenuItem key={id} onClick={() => restoreSection(id)}>
                    {DEFAULT_SECTION_NAMES[id]}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {showPhotoHidden && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => updateSettings({ showPhoto: true })}
                >
                  Show photo
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Popover open={confirmReset} onOpenChange={setConfirmReset}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon-sm" title="Reset resume">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 space-y-2" align="start">
          <p className="text-xs">
            Reset the whole resume to the sample data? You can undo this.
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

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="h-4 w-4 hidden dark:block" />
      </Button>
      <Button variant="outline" size="sm" className="h-8" onClick={onTogglePdf}>
        {showPdf ? "Hide PDF" : "Show PDF"}
      </Button>
      <Button variant="outline" size="sm" className="h-8" onClick={onPrint}>
        <Printer className="h-3.5 w-3.5 mr-1" /> Print
      </Button>
      <Button
        size="sm"
        className="h-8"
        onClick={onDownload}
        disabled={isDownloading}
      >
        <Download className="h-3.5 w-3.5 mr-1" /> Download
      </Button>
    </div>
  );
}
