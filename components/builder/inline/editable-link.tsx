"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useEditing } from "./editing-context";

interface EditableLinkProps {
  url: string;
  onCommit: (url: string) => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Wraps a link's visual (icon or text). In edit mode, clicking opens a
 * URL editor instead of navigating.
 */
export function EditableLink({
  url,
  onCommit,
  className,
  style,
  children,
}: EditableLinkProps) {
  const { editable } = useEditing();
  const [draft, setDraft] = useState(url);
  const [open, setOpen] = useState(false);

  if (!editable) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={className}
        style={style}
      >
        {children}
      </a>
    );
  }

  const toggle = (next: boolean) => {
    setOpen(next);
    if (next) setDraft(url);
    else if (draft !== url) onCommit(draft.trim());
  };

  return (
    <Popover open={open} onOpenChange={toggle}>
      <PopoverTrigger asChild>
        {/*
          An anchor even while editing. Printing is what produces the PDF, and
          Chrome only writes a clickable link annotation for a real <a href> —
          a span styled as a link exports as dead text. Clicking still opens
          the URL editor rather than navigating.

          The popover is opened here rather than by the trigger's own handler:
          preventDefault (which stops navigation) also tells Radix to skip its
          composed handler, so the two have to be done together.
        */}
        <a
          href={url || undefined}
          target="_blank"
          rel="noreferrer"
          tabIndex={0}
          draggable={false}
          className={cn(
            "editable-field cursor-pointer rounded-[2px] transition-colors hover:bg-black/5 outline-none",
            className,
          )}
          style={style}
          onClick={(e) => {
            e.preventDefault();
            toggle(!open);
          }}
        >
          {children}
        </a>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2" align="start">
        <Label className="text-xs">Link URL</Label>
        <Input
          value={draft}
          placeholder="https://…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommit(draft.trim());
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
