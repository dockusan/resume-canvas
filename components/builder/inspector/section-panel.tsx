"use client";

import { SECTION_FIELDS } from "@/lib/schema/defaults";
import { SectionNode } from "@/lib/schema/document";
import {
  DENSITY_LOOKS,
  DIVIDER_LOOKS,
  HEADING_LOOKS,
  SECTION_VARIANTS,
  TIMELINE_LOOKS,
  applyHeadingLook,
  currentLook,
  currentVariant,
} from "@/lib/schema/style-presets";
import { useDocument } from "@/lib/schema/use-document";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Group, IconField, NumberField, Row, Segmented } from "./controls";
import { Switch } from "@/components/ui/switch";
import { ChoiceRow, OptionCards } from "./option-cards";
import {
  DensityPreview,
  DividerPreview,
  HeadingPreview,
  TimelinePreview,
} from "./previews";
import { SectionAdvanced } from "./section-advanced";

/**
 * Everyday section styling: a handful of visual choices rather than the
 * schema's underlying border widths and pixel offsets, which live under
 * "Advanced" for anyone who wants them.
 */
export function SectionPanel({ node }: { node: SectionNode }) {
  const doc = useDocument();
  const update = useResumeStore((s) => s.updateSectionNode);
  const togglePageBreak = useResumeStore((s) => s.toggleSectionPageBreak);
  const [advanced, setAdvanced] = useState(false);
  const theme = doc.theme;
  const patch = (p: Parameters<typeof update>[1]) => update(node.id, p);

  const fieldDefs = SECTION_FIELDS[node.type] ?? [];
  const timelineValue = {
    marker: node.style.marker,
    itemBox: { padding: node.style.itemBox.padding },
  };
  const densityValue = {
    gap: node.items.gap,
    bottom: node.style.container.padding.bottom,
  };
  // Chip-shaped sections have no timeline or divider to speak of.
  const showsTimeline = !["skills", "socials", "summary"].includes(node.type);

  const variants = SECTION_VARIANTS[node.type] ?? [];

  return (
    <div className="px-3">
      {variants.length > 0 && (
        <Group title="Style">
          <ChoiceRow
            value={currentVariant(node.type, node)}
            onChange={(id) => {
              const variant = variants.find((v) => v.id === id);
              if (variant) patch(variant.patch);
            }}
            options={variants.map((v) => ({ id: v.id, name: v.name }))}
          />
          <p className="text-[11px] text-muted-foreground">
            {variants.find((v) => v.id === currentVariant(node.type, node))
              ?.hint ?? "Pick a shape for this section's entries."}
          </p>
        </Group>
      )}

      <Group title="Heading">
        <OptionCards
          columns={3}
          value={currentLook(HEADING_LOOKS, node.style.heading)}
          onChange={(id) => {
            const look = HEADING_LOOKS.find((l) => l.id === id);
            if (look)
              patch({
                style: { heading: applyHeadingLook(node.style, look, theme) },
              });
          }}
          options={HEADING_LOOKS.map((l) => ({
            id: l.id,
            name: l.name,
            preview: <HeadingPreview look={l.id} />,
          }))}
        />
        <ChoiceRow
          label="Size"
          value={String(node.style.heading.step)}
          onChange={(v) => patch({ style: { heading: { step: Number(v) } } })}
          options={[
            { id: "0", name: "S" },
            { id: "1", name: "M" },
            { id: "2", name: "L" },
            { id: "3", name: "XL" },
          ]}
        />
        <ChoiceRow
          label="Case"
          value={node.style.heading.font.transform}
          onChange={(v) =>
            patch({ style: { heading: { font: { transform: v as never } } } })
          }
          options={[
            { id: "none", name: "Aa" },
            { id: "uppercase", name: "AA" },
            { id: "capitalize", name: "Ab" },
          ]}
        />
        <Row label="Icon">
          <IconField
            value={node.style.heading.icon}
            onChange={(icon) => patch({ style: { heading: { icon } } })}
          />
        </Row>
      </Group>

      {showsTimeline && (
        <Group title="Item marker">
          <OptionCards
            columns={4}
            value={currentLook(TIMELINE_LOOKS, timelineValue)}
            onChange={(id) => {
              const look = TIMELINE_LOOKS.find((l) => l.id === id);
              if (!look) return;
              const next = look.build(theme);
              patch({
                style: {
                  marker: next.marker,
                  itemBox: { padding: next.itemBox.padding },
                },
              });
            }}
            options={TIMELINE_LOOKS.map((l) => ({
              id: l.id,
              name: l.name,
              preview: <TimelinePreview look={l.id} />,
            }))}
          />
        </Group>
      )}

      {showsTimeline && (
        <Group title="Between items">
          <OptionCards
            columns={4}
            value={currentLook(DIVIDER_LOOKS, node.style.separator)}
            onChange={(id) => {
              const look = DIVIDER_LOOKS.find((l) => l.id === id);
              if (look) patch({ style: { separator: look.build(theme) } });
            }}
            options={DIVIDER_LOOKS.map((l) => ({
              id: l.id,
              name: l.name,
              preview: <DividerPreview look={l.id} />,
            }))}
          />
        </Group>
      )}

      <Group title="Spacing">
        <OptionCards
          columns={3}
          value={currentLook(DENSITY_LOOKS, densityValue)}
          onChange={(id) => {
            const look = DENSITY_LOOKS.find((l) => l.id === id);
            if (!look) return;
            const next = look.build(theme);
            patch({
              items: { gap: next.gap },
              style: {
                container: {
                  padding: {
                    ...node.style.container.padding,
                    bottom: next.bottom,
                  },
                },
              },
            });
          }}
          options={DENSITY_LOOKS.map((l) => ({
            id: l.id,
            name: l.name,
            preview: <DensityPreview look={l.id} />,
          }))}
        />
        <Row label="Arrangement">
          <Segmented
            value={node.items.columns ? "grid" : node.items.direction}
            onChange={(v) => {
              if (v === "grid") patch({ items: { columns: 2 } });
              else patch({ items: { columns: null, direction: v as never } });
            }}
            options={[
              { value: "column", label: "Stack" },
              { value: "row", label: "Row" },
              { value: "grid", label: "Grid" },
            ]}
          />
        </Row>
        {node.items.columns ? (
          <Row label="Grid columns">
            <NumberField
              value={node.items.columns}
              onChange={(columns) => patch({ items: { columns } })}
              min={1}
              max={6}
            />
          </Row>
        ) : null}
      </Group>

      {fieldDefs.length > 0 && (
        <Group title="Show / hide">
          {fieldDefs.map((def) => {
            const spec = node.fields?.[def.key];
            const visible = spec?.visible !== false;
            return (
              <div
                key={def.key}
                className="flex items-center justify-between gap-2"
              >
                <span
                  className={cn(
                    "flex-1 text-[13px]",
                    !visible && "text-muted-foreground",
                  )}
                >
                  {def.label}
                </span>
                {visible && (
                  <IconField
                    value={spec?.icon ?? null}
                    onChange={(icon) =>
                      patch({ fields: { [def.key]: { icon } } })
                    }
                  />
                )}
                <Switch
                  checked={visible}
                  disabled={def.required}
                  onCheckedChange={(next) =>
                    patch({ fields: { [def.key]: { visible: next } } })
                  }
                  aria-label={`Show ${def.label}`}
                  className="shrink-0"
                />
              </div>
            );
          })}
        </Group>
      )}

      <Group title="Page">
        <ChoiceRow
          label="Start on a new page"
          value={node.flow.breakBefore ? "yes" : "no"}
          onChange={(v) => {
            if ((v === "yes") !== node.flow.breakBefore)
              togglePageBreak(node.id);
          }}
          options={[
            { id: "no", name: "No" },
            { id: "yes", name: "Yes" },
          ]}
        />
        <ChoiceRow
          label="Keep on one page"
          value={node.flow.keepTogether ? "yes" : "no"}
          onChange={(v) => patch({ flow: { keepTogether: v === "yes" } })}
          options={[
            { id: "no", name: "No" },
            { id: "yes", name: "Yes" },
          ]}
        />
      </Group>

      <div className="py-3 border-t">
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="w-full flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          Advanced
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform",
              advanced && "rotate-180",
            )}
          />
        </button>
      </div>
      {advanced && (
        <div className="-mx-3">
          <SectionAdvanced node={node} />
        </div>
      )}
    </div>
  );
}
