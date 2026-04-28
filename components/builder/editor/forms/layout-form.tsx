"use client";

import Select from "@/components/shared/select";
import { Label } from "@/components/ui/label";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Reorder } from "framer-motion";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const templates = [
  { value: "classic", label: "Classic (2-Column)" },
  { value: "modern", label: "Modern (1-Column)" },
  { value: "modern-2col", label: "Modern (2-Column)" },
  { value: "minimal", label: "Minimal (Monochrome)" },
  { value: "executive", label: "Executive (1-Column Densified)" },
  { value: "creative", label: "Creative (Offset 2-Column)" },
];

export function LayoutForm() {
  const { settings, updateLayoutSettings } = useResumeStore();

  const handleToggleVisibility = (
    column: "leftColumn" | "rightColumn",
    id: string,
  ) => {
    const list = settings[column] || [];
    const newList = list.map((item) =>
      item.id === id ? { ...item, visible: !item.visible } : item,
    );
    updateLayoutSettings({ [column]: newList });
  };

  return (
    <div className="bg-card border rounded-2xl p-6">
      <h4 className="text-lg font-semibold mb-4">Template & Layout</h4>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Select Template</Label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((t) => {
              const isActive = settings.template === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    updateLayoutSettings({ template: t.value as any })
                  }
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all hover:bg-muted/50 ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/20 hover:border-primary/30"
                  }`}
                >
                  <div className="w-full h-24 mb-3 rounded-lg overflow-hidden border bg-background flex shadow-sm">
                    {/* Visual mini-render depending on layout */}
                    {t.value === "classic" && (
                      <div className="w-full flex">
                        <div className="w-[60%] h-full p-2 flex flex-col gap-1">
                          <div className="w-full h-3 bg-muted rounded-[2px]" />
                          <div className="w-1/2 h-1.5 bg-muted rounded-[2px]" />
                          <div className="w-full h-[1px] bg-muted mt-1" />
                          <div className="w-3/4 h-1.5 bg-muted rounded-[2px]" />
                          <div className="w-full h-1.5 bg-muted rounded-[2px]" />
                        </div>
                        <div className="w-[40%] h-full bg-primary/10 p-2 flex flex-col items-center gap-1 border-l">
                          <div className="w-6 h-6 rounded-full bg-primary/20 mb-1" />
                          <div className="w-full h-1.5 bg-primary/20 rounded-[2px]" />
                          <div className="w-3/4 h-1.5 bg-primary/20 rounded-[2px]" />
                        </div>
                      </div>
                    )}
                    {t.value === "modern" && (
                      <div className="w-full flex flex-col">
                        <div className="w-full h-[30%] bg-primary/10 border-b flex p-2 gap-2 items-center">
                          <div className="w-5 h-5 rounded-md bg-primary/20 shrink-0" />
                          <div className="flex w-full flex-col gap-1">
                            <div className="w-3/4 h-2 bg-primary/20 rounded-[2px]" />
                            <div className="w-1/2 h-1.5 bg-primary/20 rounded-[2px]" />
                          </div>
                        </div>
                        <div className="p-2 w-full flex flex-col gap-1">
                          <div className="w-1/3 h-1.5 bg-muted rounded-[2px] mb-1" />
                          <div className="w-full h-1.5 bg-muted rounded-[2px]" />
                          <div className="w-3/4 h-1.5 bg-muted rounded-[2px]" />
                        </div>
                      </div>
                    )}
                    {t.value === "modern-2col" && (
                      <div className="w-full flex flex-col">
                        <div className="w-full h-[25%] bg-muted/30 border-b-2 border-primary border-b shrink-0 flex items-center p-1.5 gap-2">
                          <div className="w-4 h-4 rounded-full bg-muted" />
                          <div className="w-1/2 h-2 bg-muted rounded-[2px]" />
                        </div>
                        <div className="w-full flex flex-1">
                          <div className="w-[70%] h-full p-2 flex flex-col gap-1 pr-1">
                            <div className="w-full h-1.5 bg-muted rounded-[2px]" />
                            <div className="w-3/4 h-1.5 bg-muted rounded-[2px]" />
                          </div>
                          <div className="w-[30%] h-full p-1.5 flex flex-col gap-1 bg-muted/20 border-l border-muted/30">
                            <div className="w-full h-1.5 bg-muted rounded-[2px]" />
                          </div>
                        </div>
                      </div>
                    )}
                    {t.value === "minimal" && (
                      <div className="w-full flex flex-col p-2">
                        <div className="w-full border-b flex justify-between items-start pb-1.5 mb-1.5">
                          <div className="w-1/2 flex flex-col gap-1">
                            <div className="w-full h-2 bg-muted rounded-[2px]" />
                            <div className="w-3/4 h-1 bg-muted rounded-[2px]" />
                          </div>
                          <div className="w-4 h-4 rounded-full bg-muted" />
                        </div>
                        <div className="w-1/3 h-1 bg-muted rounded-[2px] mb-1" />
                        <div className="w-full h-[2.5px] bg-muted mb-1" />
                        <div className="w-full h-1 bg-muted rounded-[2px] mb-0.5" />
                      </div>
                    )}
                    {t.value === "executive" && (
                      <div className="w-full flex flex-col bg-background p-2 border-t-[3px] border-primary">
                        <div className="w-full flex gap-2 items-center mb-2">
                          <div className="w-5 h-5 bg-muted rounded-[2px]" />
                          <div className="w-[70%] flex flex-col gap-1">
                            <div className="w-full h-2.5 bg-muted rounded-[2px]" />
                            <div className="w-1/2 h-1 bg-primary/30 rounded-[2px]" />
                          </div>
                        </div>
                        <div className="w-1/3 h-1.5 bg-muted rounded-[2px] border-b pb-0.5 mb-1" />
                        <div className="w-full h-1 bg-muted rounded-[2px] mb-0.5" />
                      </div>
                    )}
                    {t.value === "creative" && (
                      <div className="w-full h-full flex">
                        <div className="w-[35%] h-full bg-muted/40 p-1.5 flex flex-col items-center">
                          <div className="w-6 h-6 border rotate-[-5deg] bg-muted shadow-sm mb-1" />
                          <div className="w-full h-1.5 bg-muted rounded-[2px] mb-1" />
                          <div className="w-full h-4 bg-background border flex flex-col gap-[1px] p-0.5">
                            <div className="w-full h-[1px] bg-muted" />
                            <div className="w-full h-[1px] bg-muted" />
                          </div>
                        </div>
                        <div className="w-[65%] h-full p-2 flex flex-col">
                          <div className="w-2/3 h-2 bg-primary/20 rounded-[2px] mb-1" />
                          <div className="w-full h-full border-l-2 border-primary/20 pl-1 flex flex-col gap-1">
                            <div className="w-full h-1 bg-muted rounded-[2px]" />
                            <div className="w-3/4 h-1 bg-muted rounded-[2px]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[12px] font-medium text-center leading-tight ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block text-muted-foreground">
              Main Column Order
            </Label>
            <Reorder.Group
              axis="y"
              values={settings.leftColumn || []}
              onReorder={(newList) =>
                updateLayoutSettings({ leftColumn: newList })
              }
              className="flex flex-col gap-2"
            >
              {(settings.leftColumn || []).map((item) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className="flex items-center gap-2 p-2 bg-muted/50 border rounded-md cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium">
                    {item.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleVisibility("leftColumn", item.id);
                    }}
                  >
                    {item.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          <div>
            <Label className="mb-2 block text-muted-foreground">
              Sidebar Order (for 2-column templates)
            </Label>
            <Reorder.Group
              axis="y"
              values={settings.rightColumn || []}
              onReorder={(newList) =>
                updateLayoutSettings({ rightColumn: newList })
              }
              className="flex flex-col gap-2"
            >
              {(settings.rightColumn || []).map((item) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className="flex items-center gap-2 p-2 bg-muted/50 border rounded-md cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium">
                    {item.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleVisibility("rightColumn", item.id);
                    }}
                  >
                    {item.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </div>
      </div>
    </div>
  );
}
