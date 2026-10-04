"use client";

import { PageSize, spacingOf } from "@/lib/schema/document";
import { PRESET_META, buildPreset } from "@/lib/schema/presets";
import {
  CONTRAST_PRESETS,
  DENSITY_PRESETS,
  FONT_PAIRS,
  HEADING_WEIGHTS,
  MARGIN_PRESETS,
  PALETTES,
  SPACING_PRESETS,
  TEXT_SIZES,
  activeFontPair,
} from "@/lib/schema/style-presets";
import { useDocument } from "@/lib/schema/use-document";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Group } from "./controls";
import { DocumentAdvanced } from "./document-advanced";
import { ChoiceRow, OptionCards, SwatchCards } from "./option-cards";
import { ColumnsPreview, TemplatePreview } from "./previews";

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
  const headingFamily =
    theme.fonts.heading.family === "inherit"
      ? bodyFamily
      : theme.fonts.heading.family;
  const activeFont = activeFontPair(headingFamily, bodyFamily)?.id ?? null;
  const activeSize =
    TEXT_SIZES.find((s) => Math.abs(s.base - theme.scale.base) < 0.6)?.id ??
    null;
  const activeMargin =
    MARGIN_PRESETS.find((m) => m.value === page.margin.top)?.id ?? null;
  const contrast = theme.scale.contrast ?? 1;
  const activeContrast =
    CONTRAST_PRESETS.find((c) => Math.abs(c.value - contrast) < 0.05)?.id ??
    null;
  const spacing = spacingOf(theme);
  const activeDensity =
    DENSITY_PRESETS.find(
      (d) =>
        Math.abs(d.value - spacing.section) < 0.05 &&
        Math.abs(d.value - spacing.item) < 0.05 &&
        Math.abs(d.value - spacing.bullet) < 0.05,
    )?.id ?? null;
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
          options={PRESET_META.map((p) => ({
            id: p.id,
            name: p.name,
            // Previews are built from each preset's own data, so they show the
            // real column split, fills and heading style.
            preview: (
              <TemplatePreview
                preset={buildPreset(p.id, theme.colors.accent)}
              />
            ),
          }))}
        />
        <p className="text-[11px] text-muted-foreground">
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

      <Group title="Typography">
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
                className="text-[17px] leading-none"
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
        <ChoiceRow
          label="Hierarchy"
          value={activeContrast}
          onChange={(id) => {
            const c = CONTRAST_PRESETS.find((x) => x.id === id);
            if (c) updateTheme({ scale: { contrast: c.value } });
          }}
          options={CONTRAST_PRESETS.map((c) => ({ id: c.id, name: c.name }))}
        />
        <ChoiceRow
          label="Heading weight"
          value={String(theme.fonts.heading.weight)}
          onChange={(w) =>
            updateTheme({ fonts: { heading: { weight: Number(w) } } })
          }
          options={HEADING_WEIGHTS}
        />
        <ChoiceRow
          label="Heading case"
          value={theme.fonts.heading.transform}
          onChange={(t) =>
            updateTheme({
              fonts: {
                heading: {
                  transform: t as "none" | "uppercase" | "capitalize",
                },
              },
            })
          }
          options={[
            { id: "uppercase", name: "UPPER" },
            { id: "capitalize", name: "Title" },
            { id: "none", name: "As typed" },
          ]}
        />
      </Group>

      <Group title="Spacing">
        <ChoiceRow
          label="Density"
          value={activeDensity}
          onChange={(id) => {
            const d = DENSITY_PRESETS.find((x) => x.id === id);
            if (d)
              updateTheme({
                spacing: { section: d.value, item: d.value, bullet: d.value },
              });
          }}
          options={DENSITY_PRESETS.map((d) => ({ id: d.id, name: d.name }))}
        />
        <p className="text-[11px] text-muted-foreground">
          Space between sections, entries and bullet points. Fine-tune each
          under Advanced.
        </p>
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
          <DocumentAdvanced />
        </div>
      )}
    </div>
  );
}
