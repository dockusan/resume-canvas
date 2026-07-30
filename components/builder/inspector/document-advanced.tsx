"use client";

import { PAGE_DIMENSIONS, PageSize } from "@/lib/schema/document";
import { useDocument } from "@/lib/schema/use-document";
import { useResumeStore } from "@/lib/store/useResumeStore";
import {
  BoxField,
  ColorField,
  FillField,
  Group,
  NumberField,
  Row,
  Segmented,
  SliderField,
} from "./controls";

/** Raw page/theme/layout values, reached through "Advanced". */
export function DocumentAdvanced() {
  const doc = useDocument();
  const updateLayout = useResumeStore((s) => s.updateLayout);
  const updateTheme = useResumeStore((s) => s.updateTheme);
  const updatePage = useResumeStore((s) => s.updatePage);
  const updateSettings = useResumeStore((s) => s.updateSettings);

  const { layout, theme, page } = doc;

  return (
    <div className="px-3">
      <Group title="Page">
        <Row label="Size">
          <Segmented
            value={page.size}
            onChange={(size) => {
              updatePage({ size: size as PageSize });
              updateSettings({ documentSize: size as PageSize });
            }}
            options={(Object.keys(PAGE_DIMENSIONS) as PageSize[]).map((s) => ({
              value: s,
              label: s,
            }))}
          />
        </Row>
        <Row label="Margins">
          <BoxField
            value={page.margin}
            onChange={(margin) => updatePage({ margin })}
            max={120}
          />
        </Row>
        <Row label="Background">
          <FillField
            value={page.background}
            onChange={(background) => updatePage({ background })}
          />
        </Row>
      </Group>

      <Group title="Columns">
        <Row label="Layout">
          <Segmented
            value={String(layout.columns)}
            onChange={(v) => updateLayout({ columns: Number(v) as 1 | 2 })}
            options={[
              { value: "1", label: "One" },
              { value: "2", label: "Two" },
            ]}
          />
        </Row>
        {layout.columns === 2 && (
          <>
            <Row label="Split" stacked hint="Width of the left column">
              <SliderField
                value={Math.round(layout.ratio * 100)}
                onChange={(v) => updateLayout({ ratio: v / 100 })}
                min={20}
                max={80}
                step={1}
                format={(v) => `${v}/${100 - v}`}
              />
            </Row>
            <Row label="Gap">
              <NumberField
                value={layout.gap}
                onChange={(gap) => updateLayout({ gap })}
                max={80}
                suffix="px"
              />
            </Row>
            <Row label="Left fill">
              <FillField
                value={layout.fills.left}
                onChange={(left) =>
                  updateLayout({ fills: { ...layout.fills, left } })
                }
              />
            </Row>
            <Row label="Right fill">
              <FillField
                value={layout.fills.right}
                onChange={(right) =>
                  updateLayout({ fills: { ...layout.fills, right } })
                }
              />
            </Row>
            <Row label="Left padding">
              <BoxField
                value={layout.padding.left}
                onChange={(left) =>
                  updateLayout({ padding: { ...layout.padding, left } })
                }
              />
            </Row>
            <Row label="Right padding">
              <BoxField
                value={layout.padding.right}
                onChange={(right) =>
                  updateLayout({ padding: { ...layout.padding, right } })
                }
              />
            </Row>
          </>
        )}
        {layout.columns === 1 && (
          <Row label="Padding">
            <BoxField
              value={layout.padding.left}
              onChange={(left) =>
                updateLayout({ padding: { ...layout.padding, left } })
              }
            />
          </Row>
        )}
      </Group>

      <Group title="Colours">
        {(
          [
            ["accent", "Accent"],
            ["text", "Body text"],
            ["heading", "Headings"],
            ["muted", "Muted text"],
            ["border", "Borders"],
            ["onFill", "Text on fills"],
          ] as const
        ).map(([key, label]) => (
          <Row key={key} label={label}>
            <ColorField
              value={theme.colors[key]}
              onChange={(v) => {
                updateTheme({ colors: { [key]: v } });
                if (key === "accent") updateSettings({ themeColor: v });
              }}
            />
          </Row>
        ))}
      </Group>

      <Group title="Type scale">
        <Row label="Base size" stacked>
          <SliderField
            value={theme.scale.base}
            onChange={(base) => updateTheme({ scale: { base } })}
            min={8}
            max={22}
            step={0.5}
            format={(v) => `${v}px`}
          />
        </Row>
        <Row label="Scale ratio" hint="How much larger each step is" stacked>
          <SliderField
            value={theme.scale.ratio}
            onChange={(ratio) => updateTheme({ scale: { ratio } })}
            min={1}
            max={1.4}
            step={0.01}
            format={(v) => v.toFixed(2)}
          />
        </Row>
        <Row label="Heading weight">
          <Segmented
            value={String(theme.fonts.heading.weight)}
            onChange={(w) =>
              updateTheme({ fonts: { heading: { weight: Number(w) } } })
            }
            options={[400, 500, 600, 700].map((w) => ({
              value: String(w),
              label: String(w),
            }))}
          />
        </Row>
        <Row label="Heading case">
          <Segmented
            value={theme.fonts.heading.transform}
            onChange={(t) =>
              updateTheme({ fonts: { heading: { transform: t } } })
            }
            options={[
              { value: "none", label: "Aa" },
              { value: "uppercase", label: "AA" },
              { value: "capitalize", label: "Ab" },
            ]}
          />
        </Row>
        <Row label="Line height" stacked>
          <SliderField
            value={theme.fonts.body.lineHeight}
            onChange={(lineHeight) =>
              updateTheme({ fonts: { body: { lineHeight } } })
            }
            min={1}
            max={2}
            step={0.05}
            format={(v) => v.toFixed(2)}
          />
        </Row>
      </Group>
    </div>
  );
}
