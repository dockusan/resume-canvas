"use client";

import { PageSize } from "@/lib/schema/document";
import { PRESET_META } from "@/lib/schema/presets";
import {
  FONT_PAIRS,
  MARGIN_PRESETS,
  PALETTES,
  SPACING_PRESETS,
  TEXT_SIZES,
} from "@/lib/schema/style-presets";
import { useDocument } from "@/lib/schema/use-document";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Group } from "./controls";
import { DocumentAdvanced } from "./document-advanced";
import { ChoiceRow, OptionCards, SwatchCards } from "./option-cards";
import { ColumnsPreview } from "./previews";

const COLUMN_CHOICES = [
  { id: "one", name: "One column", ratio: null as number | null },
  { id: "35-65", name: "Narrow left", ratio: 0.35 },
  { id: "50-50", name: "Even", ratio: 0.5 },
  { id: "65-35", name: "Narrow right", ratio: 0.65 },
];

/** Whole-document look: template, palette, type and page setup. */
export function DocumentPanel() {
  const doc = useDocument();
  const setPreset = useResumeStore((s) => s.setPreset);
  const updateTheme = useResumeStore((s) => s.updateTheme);
  const updateLayout = useResumeStore((s) => s.updateLayout);
  const updatePage = useResumeStore((s) => s.updatePage);
  const updateSettings = useResumeStore((s) => s.updateSettings);
  const settingsFontFamily = useResumeStore((s) => s.settings.fontFamily);
  const [advanced, setAdvanced] = useState(false);

  const { theme, layout, page } = doc;

  const activeColumns =
    layout.columns === 1
      ? "one"
      : (COLUMN_CHOICES.find(
          (c) => c.ratio !== null && Math.abs(c.ratio - layout.ratio) < 0.03,
        )?.id ?? null);

  const activePalette =
    PALETTES.find((p) => p.colors.accent === theme.colors.accent)?.id ?? null;
  // The theme's body font defaults to "inherit" (the sheet supplies it), so
  // fall back to the sheet's family or no pair would ever look selected.
  const bodyFamily =
    theme.fonts.body.family === "inherit"
      ? settingsFontFamily
      : theme.fonts.body.family;
  const activeFont = FONT_PAIRS.find((f) => f.body === bodyFamily)?.id ?? null;
  const activeSize =
    TEXT_SIZES.find((s) => Math.abs(s.base - theme.scale.base) < 0.6)?.id ??
    null;
  const activeMargin =
    MARGIN_PRESETS.find((m) => m.value === page.margin.top)?.id ?? null;
  const activeSpacing =
    SPACING_PRESETS.find(
      (s) => Math.abs(s.lineHeight - theme.fonts.body.lineHeight) < 0.06,
    )?.id ?? null;

  return (
    <div className="px-3">
      <Group title="Template">
        <OptionCards
          columns={3}
          value={doc.preset}
          onChange={setPreset}
          options={PRESET_META.map((p) => ({ id: p.id, name: p.name }))}
        />
        <p className="text-[10px] text-muted-foreground">
          A template is a starting point — everything below stays editable.
        </p>
      </Group>

      <Group title="Colour">
        <SwatchCards
          value={activePalette}
          onChange={(id) => {
            const palette = PALETTES.find((p) => p.id === id);
            if (!palette) return;
            updateTheme({ colors: palette.colors });
            updateSettings({ themeColor: palette.colors.accent });
          }}
          options={PALETTES.map((p) => ({
            id: p.id,
            name: p.name,
            colors: [p.colors.accent, p.colors.heading, p.colors.muted],
          }))}
        />
      </Group>

      <Group title="Type">
        <OptionCards
          columns={2}
          value={activeFont}
          onChange={(id) => {
            const pair = FONT_PAIRS.find((f) => f.id === id);
            if (!pair) return;
            updateTheme({
              fonts: {
                heading: { family: pair.heading },
                body: { family: pair.body },
              },
            });
            updateSettings({ fontFamily: pair.body });
          }}
          options={FONT_PAIRS.map((f) => ({
            id: f.id,
            name: f.name,
            preview: (
              <span
                className="text-[15px] leading-none"
                style={{ fontFamily: f.heading }}
              >
                Ag
              </span>
            ),
          }))}
        />
        <ChoiceRow
          label="Text size"
          value={activeSize}
          onChange={(id) => {
            const size = TEXT_SIZES.find((s) => s.id === id);
            if (size) updateTheme({ scale: { base: size.base } });
          }}
          options={TEXT_SIZES.map((s) => ({ id: s.id, name: s.name }))}
        />
        <ChoiceRow
          label="Line spacing"
          value={activeSpacing}
          onChange={(id) => {
            const s = SPACING_PRESETS.find((x) => x.id === id);
            if (s)
              updateTheme({ fonts: { body: { lineHeight: s.lineHeight } } });
          }}
          options={SPACING_PRESETS.map((s) => ({ id: s.id, name: s.name }))}
        />
      </Group>

      <Group title="Layout">
        <OptionCards
          columns={4}
          value={activeColumns}
          onChange={(id) => {
            const choice = COLUMN_CHOICES.find((c) => c.id === id);
            if (!choice) return;
            if (choice.ratio === null) updateLayout({ columns: 1 });
            else updateLayout({ columns: 2, ratio: choice.ratio });
          }}
          options={COLUMN_CHOICES.map((c) => ({
            id: c.id,
            name: c.name,
            preview: <ColumnsPreview ratio={c.ratio} />,
          }))}
        />
      </Group>

      <Group title="Page">
        <ChoiceRow
          label="Paper"
          value={page.size}
          onChange={(size) => {
            updatePage({ size: size as PageSize });
            updateSettings({ documentSize: size as PageSize });
          }}
          options={[
            { id: "A4", name: "A4" },
            { id: "Letter", name: "Letter" },
          ]}
        />
        <ChoiceRow
          label="Margins"
          value={activeMargin}
          onChange={(id) => {
            const m = MARGIN_PRESETS.find((x) => x.id === id);
            if (m)
              updatePage({
                margin: {
                  top: m.value,
                  right: m.value,
                  bottom: m.value,
                  left: m.value,
                },
              });
          }}
          options={MARGIN_PRESETS.map((m) => ({ id: m.id, name: m.name }))}
        />
      </Group>

      <div className="py-3 border-t">
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="w-full flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
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
          <DocumentAdvanced />
        </div>
      )}
    </div>
  );
}
