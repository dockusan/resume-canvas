"use client";

import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BorderSpec, Box, Fill, Sides } from "@/lib/schema/document";
import { cn } from "@/lib/utils";
import { DocIcon } from "@/components/builder/preview/sections/doc-icon";
import { iconList } from "@/lib/icons";
import { Ban, Link2, Link2Off, Palette, X } from "lucide-react";
import { useState } from "react";

/** Label on the left, control on the right — the inspector's only row shape. */
export function Row({
  label,
  hint,
  children,
  stacked,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        "gap-2",
        stacked ? "flex flex-col" : "flex items-center justify-between",
      )}
    >
      <div className="min-w-0">
        <div className="text-xs">{label}</div>
        {hint && (
          <div className="text-[10px] text-muted-foreground">{hint}</div>
        )}
      </div>
      <div className={cn(stacked ? "w-full" : "shrink-0")}>{children}</div>
    </div>
  );
}

export function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5 py-3 border-b last:border-b-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

export function NumberField({
  value,
  onChange,
  min = 0,
  max = 200,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);
        }}
        className="h-7 w-16 px-2 text-xs"
      />
      {suffix && (
        <span className="text-[10px] text-muted-foreground">{suffix}</span>
      )}
    </div>
  );
}

export function SliderField({
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-2 w-full">
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="flex-1"
      />
      <span className="text-[10px] tabular-nums text-muted-foreground w-10 text-right">
        {format ? format(value) : value}
      </span>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; title?: string }[];
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      className="gap-0.5"
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          title={o.title ?? String(o.label)}
          className="h-7 px-2 text-[11px]"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Colour swatch that opens the shared picker. */
export function ColorField({
  value,
  onChange,
  allowNone,
  onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  allowNone?: boolean;
  onClear?: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-7 w-12 rounded border flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: value || "transparent" }}
          title="Change colour"
        >
          {!value && <Palette className="w-3 h-3 opacity-50" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-2" align="end">
        <ColorPicker value={value || "#000000"} onChange={onChange} />
        {allowNone && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="w-full text-xs flex items-center justify-center gap-1 py-1 rounded hover:bg-muted"
          >
            <Ban className="w-3 h-3" /> None
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Solid / gradient / none, as one control. */
export function FillField({
  value,
  onChange,
}: {
  value: Fill;
  onChange: (f: Fill) => void;
}) {
  const solidColor =
    value.type === "solid"
      ? value.color
      : value.type === "gradient"
        ? value.from
        : "";
  return (
    <div className="flex items-center gap-1.5">
      <Segmented
        value={value.type}
        onChange={(t) => {
          if (t === "none") onChange({ type: "none" });
          else if (t === "solid")
            onChange({ type: "solid", color: solidColor || "#f3f4f6" });
          else
            onChange({
              type: "gradient",
              from: solidColor || "#f3f4f6",
              to: "#ffffff",
              angle: 90,
            });
        }}
        options={[
          { value: "none", label: "—", title: "No fill" },
          { value: "solid", label: "Solid" },
          { value: "gradient", label: "Grad" },
        ]}
      />
      {value.type === "solid" && (
        <ColorField
          value={value.color}
          onChange={(c) => onChange({ ...value, color: c })}
        />
      )}
      {value.type === "gradient" && (
        <>
          <ColorField
            value={value.from}
            onChange={(c) => onChange({ ...value, from: c })}
          />
          <ColorField
            value={value.to}
            onChange={(c) => onChange({ ...value, to: c })}
          />
        </>
      )}
    </div>
  );
}

const SIDE_KEYS: (keyof Sides)[] = ["top", "right", "bottom", "left"];

export function BorderField({
  value,
  onChange,
}: {
  value: BorderSpec | null;
  onChange: (b: BorderSpec | null) => void;
}) {
  if (!value) {
    return (
      <button
        type="button"
        className="text-xs px-2 py-1 rounded border border-dashed text-muted-foreground hover:bg-muted"
        onClick={() =>
          onChange({
            width: 1,
            style: "solid",
            color: "#e5e7eb",
            sides: { top: false, right: false, bottom: true, left: false },
          })
        }
      >
        Add border
      </button>
    );
  }
  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center gap-1.5 justify-end">
        <NumberField
          value={value.width}
          onChange={(w) => onChange({ ...value, width: w })}
          min={0}
          max={20}
          suffix="px"
        />
        <Segmented
          value={value.style}
          onChange={(s) => onChange({ ...value, style: s })}
          options={[
            { value: "solid", label: "──", title: "Solid" },
            { value: "dashed", label: "╌╌", title: "Dashed" },
            { value: "dotted", label: "···", title: "Dotted" },
          ]}
        />
        <ColorField
          value={value.color}
          onChange={(c) => onChange({ ...value, color: c })}
        />
        <button
          type="button"
          title="Remove border"
          onClick={() => onChange(null)}
          className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"
        >
          <Ban className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-center gap-1 justify-end">
        {SIDE_KEYS.map((side) => (
          <button
            key={side}
            type="button"
            title={side}
            onClick={() =>
              onChange({
                ...value,
                sides: { ...value.sides, [side]: !value.sides[side] },
              })
            }
            className={cn(
              "h-6 px-1.5 rounded text-[10px] capitalize",
              value.sides[side]
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {side[0]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Four-sided box value with an optional link-all toggle. */
export function BoxField({
  value,
  onChange,
  max = 80,
}: {
  value: Box;
  onChange: (b: Box) => void;
  max?: number;
}) {
  const uniform =
    value.top === value.right &&
    value.right === value.bottom &&
    value.bottom === value.left;
  const [linked, setLinked] = useState(uniform);

  const setAll = (n: number) =>
    onChange({ top: n, right: n, bottom: n, left: n });

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        title={linked ? "Edit sides separately" : "Link all sides"}
        onClick={() => setLinked((v) => !v)}
        className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"
      >
        {linked ? (
          <Link2 className="w-3 h-3" />
        ) : (
          <Link2Off className="w-3 h-3" />
        )}
      </button>
      {linked ? (
        <NumberField
          value={value.top}
          onChange={setAll}
          min={0}
          max={max}
          suffix="px"
        />
      ) : (
        <div className="grid grid-cols-2 gap-1">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <NumberField
              key={side}
              value={value[side]}
              onChange={(n) => onChange({ ...value, [side]: n })}
              min={0}
              max={max}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Icon chooser for schema fields. Deliberately separate from the in-canvas
 * `IconPickerPopover`, which gates itself on the editing context.
 */
export function IconField({
  value,
  onChange,
  icons = iconList,
}: {
  value: string | null;
  onChange: (icon: string | null) => void;
  icons?: readonly string[];
}) {
  const [search, setSearch] = useState("");
  const filtered = icons.filter((n) =>
    n.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={value ? `Icon: ${value}` : "Choose an icon"}
          className="h-7 min-w-7 px-1.5 rounded border hover:bg-muted flex items-center justify-center gap-1 text-[10px]"
        >
          {value ? (
            <DocIcon name={value} size={16} />
          ) : (
            <span className="text-muted-foreground">none</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 space-y-2" align="end">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons"
          className="h-7 text-xs"
        />
        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-auto">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => onChange(name)}
              className={cn(
                "h-6 w-6 rounded flex items-center justify-center hover:bg-muted",
                value === name && "bg-primary text-primary-foreground",
              )}
            >
              <DocIcon name={name} size={16} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="w-full text-xs flex items-center justify-center gap-1 py-1 rounded hover:bg-muted"
        >
          <X className="w-3 h-3" /> No icon
        </button>
      </PopoverContent>
    </Popover>
  );
}
