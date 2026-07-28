"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";
import { useEditing } from "./editing-context";

interface EditableSelectProps {
  value: string;
  options: readonly string[];
  onCommit: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/** Click-to-edit choice from a fixed option list (e.g. proficiency). */
export function EditableSelect({
  value,
  options,
  onCommit,
  className,
  style,
  children,
}: EditableSelectProps) {
  const { editable } = useEditing();
  const [open, setOpen] = useState(false);

  if (!editable) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className={cn(
            "editable-field cursor-pointer rounded-[2px] transition-colors hover:bg-black/5 outline-none",
            className,
          )}
          style={style}
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="w-full flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => {
              if (option !== value) onCommit(option);
              setOpen(false);
            }}
          >
            {option}
            {option === value && <Check className="w-3.5 h-3.5 opacity-70" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
