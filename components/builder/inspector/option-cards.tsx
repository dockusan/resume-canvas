"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CardOption {
  id: string;
  name: string;
  /** A miniature of what the choice looks like, not an icon. */
  preview?: React.ReactNode;
}

/**
 * Picker where each choice shows a small rendition of itself.
 *
 * Choosing "how the heading looks" from six named borders and radii is a
 * guessing game; choosing it from six pictures is not.
 */
export function OptionCards({
  options,
  value,
  onChange,
  columns = 3,
  label,
}: {
  options: CardOption[];
  value: string | null;
  onChange: (id: string) => void;
  columns?: number;
  label?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && <div className="text-xs">{label}</div>}
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            title={option.name}
            onClick={() => onChange(option.id)}
            className={cn(
              "group rounded-md border p-1.5 text-left transition-colors",
              value === option.id
                ? "border-primary bg-primary/5"
                : "hover:bg-muted",
            )}
          >
            {option.preview && (
              <div className="h-7 flex items-center justify-center overflow-hidden mb-1">
                {option.preview}
              </div>
            )}
            <div className="text-[10px] leading-tight text-center truncate">
              {option.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Compact swatch row for palettes. */
export function SwatchCards({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string; colors: string[] }[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          title={option.name}
          onClick={() => onChange(option.id)}
          className={cn(
            "relative rounded-md border p-1 hover:bg-muted transition-colors",
            value === option.id && "border-primary bg-primary/5",
          )}
        >
          <div className="flex h-5 overflow-hidden rounded-[3px]">
            {option.colors.map((c, i) => (
              <span key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <div className="text-[9px] mt-0.5 truncate text-center">
            {option.name}
          </div>
          {value === option.id && (
            <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-primary" />
          )}
        </button>
      ))}
    </div>
  );
}

/** Simple labelled segmented row for S / M / L style choices. */
export function ChoiceRow({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: string; name: string }[];
  value: string | null;
  onChange: (id: string) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      {label && <span className="text-xs shrink-0">{label}</span>}
      <div className="flex gap-1 flex-wrap justify-end">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "rounded-md border px-2 py-1 text-[11px] transition-colors",
              value === o.id
                ? "border-primary bg-primary/5 font-medium"
                : "hover:bg-muted",
            )}
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}
