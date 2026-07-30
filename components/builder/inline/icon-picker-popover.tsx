"use client";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DocIcon } from "@/components/builder/preview/sections/doc-icon";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useEditing } from "./editing-context";

interface IconPickerPopoverProps {
  value?: string;
  icons: readonly string[];
  onCommit: (icon: string) => void;
  className?: string;
  children: React.ReactNode;
}

/** Click the current icon to choose a different one from a searchable grid. */
export function IconPickerPopover({
  value,
  icons,
  onCommit,
  className,
  children,
}: IconPickerPopoverProps) {
  const { editable } = useEditing();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  if (!editable) return <>{children}</>;

  const filtered = icons.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className={cn(
            "editable-field cursor-pointer rounded-md transition-shadow hover:ring-1 hover:ring-sky-400/70 outline-none inline-flex",
            className,
          )}
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 space-y-2" align="start">
        <Input
          value={search}
          placeholder="Search icons…"
          className="h-8"
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => {
                onCommit(name);
                setOpen(false);
              }}
              className={cn(
                "h-7 w-7 rounded flex items-center justify-center hover:bg-muted",
                value === name && "bg-primary text-primary-foreground",
              )}
            >
              <DocIcon name={name} size={18} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
