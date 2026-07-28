"use client";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getIconComponent } from "@/lib/icons";
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
          {filtered.map((name) => {
            const Icon = getIconComponent(name);
            if (!Icon) return null;
            return (
              <button
                key={name}
                type="button"
                title={name}
                className={cn(
                  "flex items-center justify-center rounded-md p-1.5 hover:bg-accent",
                  name === value && "bg-accent ring-1 ring-primary/50",
                )}
                onClick={() => {
                  onCommit(name);
                  setOpen(false);
                }}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
