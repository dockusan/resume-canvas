"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { downscaleImage } from "@/lib/image";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { EyeOff, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { useEditing } from "./editing-context";

/** Wraps the resume photo: click to upload / remove / hide / change shape. */
export function PhotoPopover({ children }: { children: React.ReactNode }) {
  const { editable } = useEditing();
  const photoUrl = useResumeStore((s) => s.resumeData.personalInfo.photoUrl);
  const photoStyle = useResumeStore((s) => s.settings.photoStyle);
  const setPersonalInfo = useResumeStore((s) => s.setPersonalInfo);
  const updateSettings = useResumeStore((s) => s.updateSettings);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!editable) return <>{children}</>;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // Downscaled before it is stored: a full-size phone photo on its own can
    // exhaust the localStorage budget the whole editor saves into.
    setPersonalInfo({ photoUrl: await downscaleImage(file) });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className="cursor-pointer outline-none hover:ring-2 hover:ring-sky-400/70 rounded-md inline-block"
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-60 space-y-3" align="start">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5 mr-1" />
            {photoUrl ? "Replace" : "Upload"}
          </Button>
          {photoUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPersonalInfo({ photoUrl: "" })}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs">Shape</span>
          <ToggleGroup
            type="single"
            value={photoStyle || "circle"}
            onValueChange={(v) => {
              if (v)
                updateSettings({
                  photoStyle: v as "square" | "rounded" | "circle",
                });
            }}
          >
            <ToggleGroupItem value="square" className="px-2 text-xs">
              ▢
            </ToggleGroupItem>
            <ToggleGroupItem value="rounded" className="px-2 text-xs">
              ▢˖
            </ToggleGroupItem>
            <ToggleGroupItem value="circle" className="px-2 text-xs">
              ◯
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="w-full"
          onClick={() => updateSettings({ showPhoto: false })}
        >
          <EyeOff className="w-3.5 h-3.5 mr-1" /> Hide photo
        </Button>
      </PopoverContent>
    </Popover>
  );
}
