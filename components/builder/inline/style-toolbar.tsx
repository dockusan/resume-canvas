"use client";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { FontWeightOverride } from "@/lib/types";
import { Minus, Plus, RotateCcw } from "lucide-react";

const WEIGHTS: { value: FontWeightOverride; label: string }[] = [
  { value: 400, label: "Aa" },
  { value: 500, label: "Aa" },
  { value: 600, label: "Aa" },
  { value: 700, label: "Aa" },
];

interface StylePopoverProps {
  /** Override path this popover edits (section, item, or field level). */
  path: string;
  label?: string;
  children: React.ReactNode;
}

/** Floating font-size / color / weight editor for one override path. */
export function StylePopover({ path, label, children }: StylePopoverProps) {
  const override = useResumeStore((s) => s.settings.styleOverrides[path]);
  const setStyleOverride = useResumeStore((s) => s.setStyleOverride);
  const clearStyleOverride = useResumeStore((s) => s.clearStyleOverride);
  const delta = override?.fontSizeDelta ?? 0;

  const setDelta = (next: number) => {
    const clamped = Math.max(-4, Math.min(10, next));
    setStyleOverride(path, {
      fontSizeDelta: clamped === 0 ? undefined : clamped,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-64 space-y-3"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {label && (
          <div className="text-xs font-semibold text-muted-foreground">
            {label}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs">Font size</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setDelta(delta - 1)}
              disabled={delta <= -4}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-xs w-10 text-center tabular-nums">
              {delta > 0 ? `+${delta}px` : `${delta}px`}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setDelta(delta + 1)}
              disabled={delta >= 10}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs">Weight</span>
          <ToggleGroup
            type="single"
            value={override?.fontWeight ? String(override.fontWeight) : ""}
            onValueChange={(v) =>
              setStyleOverride(path, {
                fontWeight: v ? (Number(v) as FontWeightOverride) : undefined,
              })
            }
          >
            {WEIGHTS.map((w) => (
              <ToggleGroupItem
                key={w.value}
                value={String(w.value)}
                className="px-2 text-xs"
                style={{ fontWeight: w.value }}
                aria-label={`Weight ${w.value}`}
              >
                {w.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="space-y-1.5">
          <span className="text-xs">Text color</span>
          <ColorPicker
            value={override?.color || "#3e3e3e"}
            onChange={(color) => setStyleOverride(path, { color })}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => clearStyleOverride(path)}
          disabled={!override}
        >
          <RotateCcw className="w-3 h-3 mr-1" /> Reset styling
        </Button>
      </PopoverContent>
    </Popover>
  );
}
