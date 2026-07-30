"use client";

import { IconField } from "@/components/builder/inspector/controls";
import { Input } from "@/components/ui/input";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { normalizeUrl, toPlainText } from "@/lib/richtext/runs";
import { FormField } from "@/lib/schema/form-fields";
import { cn } from "@/lib/utils";

type Item = Record<string, unknown>;

/**
 * One labelled control.
 *
 * Values are stored as inline markup (the page editor can add links and bold),
 * so text goes in as plain and only overwrites the stored value when it
 * actually changes — otherwise opening a form would silently strip formatting
 * applied on the page.
 */
export function FieldInput({
  field,
  item,
  onChange,
}: {
  field: FormField;
  item: Item;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const raw = (item[field.key] ?? "") as string;
  const value = typeof raw === "string" ? toPlainText(raw) : "";

  const commit = (next: string) => {
    if (next === value) return;
    onChange({ [field.key]: next });
  };

  const label = (
    <label className="text-[11px] font-medium text-muted-foreground">
      {field.label}
    </label>
  );

  if (field.type === "dateRange") {
    const current = Boolean(item.current);
    return (
      <div className="space-y-1.5">
        {label}
        <div className="flex flex-wrap items-center gap-2">
          <MonthYearPicker
            value={(item.startDate as string) ?? ""}
            onChange={(startDate) => onChange({ startDate })}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <MonthYearPicker
            value={(item.endDate as string) ?? ""}
            onChange={(endDate) => onChange({ endDate })}
            disabled={current}
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={current}
            onChange={(e) =>
              onChange({
                current: e.target.checked,
                ...(e.target.checked ? { endDate: "" } : {}),
              })
            }
            className="h-3.5 w-3.5 accent-primary"
          />
          I currently work here
        </label>
      </div>
    );
  }

  if (field.type === "icon") {
    return (
      <div className="flex items-center justify-between gap-2">
        {label}
        <IconField
          value={(item[field.key] as string) ?? null}
          onChange={(icon) => onChange({ [field.key]: icon ?? "" })}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        {label}
        <Select
          value={(item[field.key] as string) ?? ""}
          onValueChange={(v) => onChange({ [field.key]: v })}
        >
          <SelectTrigger className="h-9 w-full" size="sm">
            <SelectValue placeholder={field.label} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "textarea" || field.type === "bullets") {
    return (
      <div className="space-y-1.5">
        {label}
        <Textarea
          defaultValue={value}
          rows={field.type === "bullets" ? 5 : 3}
          placeholder={
            field.placeholder ??
            (field.type === "bullets" ? "One point per line" : undefined)
          }
          onBlur={(e) => commit(e.target.value)}
          className="text-sm"
        />
        {field.type === "bullets" && (
          <p className="text-[10px] text-muted-foreground">
            Each line becomes its own bullet.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5")}>
      {label}
      <Input
        defaultValue={value}
        placeholder={field.placeholder}
        inputMode={field.type === "url" ? "url" : undefined}
        onBlur={(e) =>
          commit(
            field.type === "url" && e.target.value
              ? normalizeUrl(e.target.value)
              : e.target.value,
          )
        }
        className="h-9 text-sm"
      />
    </div>
  );
}
