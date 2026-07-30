"use client";

import { useResumeStore } from "@/lib/store/useResumeStore";
import { applyHtmlOverride, resolvePathOverride } from "@/lib/style-overrides";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useEditing } from "./editing-context";

interface EditableDateRangeProps {
  startDate: string;
  endDate: string;
  current: boolean;
  onCommit: (patch: {
    startDate?: string;
    endDate?: string;
    current?: boolean;
  }) => void;
  className?: string;
  style?: React.CSSProperties;
  /** Style-override path for the date field. */
  path?: string;
  children: React.ReactNode;
}

/** Click-to-edit start/end month-year range with a "current" toggle. */
export function EditableDateRange({
  startDate,
  endDate,
  current,
  onCommit,
  className,
  style,
  path,
  children,
}: EditableDateRangeProps) {
  const { editable } = useEditing();
  const overrides = useResumeStore((s) => s.settings.styleOverrides);
  const mergedStyle = applyHtmlOverride(
    style,
    resolvePathOverride(overrides, path),
  );

  if (!editable) {
    return (
      <span className={className} style={mergedStyle}>
        {children}
      </span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className={cn(
            "editable-field cursor-pointer rounded-[2px] transition-colors hover:bg-black/5 focus:bg-black/5 outline-none",
            className,
          )}
          style={mergedStyle}
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="end">
        <div className="space-y-1">
          <Label className="text-xs">Start date</Label>
          <MonthYearPicker
            value={startDate}
            onChange={(value) => onCommit({ startDate: value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End date</Label>
          <MonthYearPicker
            value={endDate}
            onChange={(value) => onCommit({ endDate: value, current: false })}
            disabled={current}
          />
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={current}
            onChange={(e) => onCommit({ current: e.target.checked })}
            className="accent-primary"
          />
          Currently here
        </label>
      </PopoverContent>
    </Popover>
  );
}
