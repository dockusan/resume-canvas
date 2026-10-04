"use client";

import { SectionNode, fontSizeAt } from "@/lib/schema/document";
import { useDocument } from "@/lib/schema/use-document";
import { useResumeStore } from "@/lib/store/useResumeStore";

import { Minus, Plus } from "lucide-react";
import {
  BorderField,
  BoxField,
  ColorField,
  FillField,
  Group,
  IconField,
  NumberField,
  Row,
  Segmented,
  SliderField,
} from "./controls";

/**
 * The raw schema controls for one section.
 *
 * Reached through "Advanced" — the everyday choices are the visual presets in
 * SectionPanel, and these are the escape hatch for anyone who wants to set a
 * specific border width or marker offset.
 */
export function SectionAdvanced({ node }: { node: SectionNode }) {
  const doc = useDocument();
  const update = useResumeStore((s) => s.updateSectionNode);
  const patch = (p: Parameters<typeof update>[1]) => update(node.id, p);

  const { heading, container, itemBox, separator, marker } = node.style;

  return (
    <div className="px-3">
      <Group title="Heading">
        <Row label="Style">
          <Segmented
            value={heading.variant}
            onChange={(variant) => patch({ style: { heading: { variant } } })}
            options={[
              { value: "plain", label: "Plain" },
              { value: "underline", label: "Rule" },
              { value: "pill", label: "Pill" },
              { value: "boxed", label: "Box" },
            ]}
          />
        </Row>
        <Row label="Size" stacked>
          <SliderField
            value={heading.step}
            onChange={(step) => patch({ style: { heading: { step } } })}
            min={0}
            max={5}
            step={0.25}
            format={(v) => `${fontSizeAt(doc.theme, v).toFixed(1)}px`}
          />
        </Row>
        <Row label="Weight">
          <Segmented
            value={String(heading.font.weight)}
            onChange={(w) =>
              patch({ style: { heading: { font: { weight: Number(w) } } } })
            }
            options={[400, 500, 600, 700].map((w) => ({
              value: String(w),
              label: String(w),
            }))}
          />
        </Row>
        <Row label="Case">
          <Segmented
            value={heading.font.transform}
            onChange={(transform) =>
              patch({ style: { heading: { font: { transform } } } })
            }
            options={[
              { value: "none", label: "Aa" },
              { value: "uppercase", label: "AA" },
              { value: "capitalize", label: "Ab" },
            ]}
          />
        </Row>
        <Row label="Align">
          <Segmented
            value={heading.align}
            onChange={(align) => patch({ style: { heading: { align } } })}
            options={[
              { value: "left", label: "L" },
              { value: "center", label: "C" },
              { value: "right", label: "R" },
            ]}
          />
        </Row>
        <Row label="Colour">
          <ColorField
            value={heading.color}
            onChange={(color) => patch({ style: { heading: { color } } })}
          />
        </Row>
        <Row label="Fill">
          <FillField
            value={heading.background}
            onChange={(background) =>
              patch({ style: { heading: { background } } })
            }
          />
        </Row>
        <Row label="Border" stacked>
          <BorderField
            value={heading.border}
            onChange={(border) => patch({ style: { heading: { border } } })}
          />
        </Row>
        <Row label="Padding">
          <BoxField
            value={heading.padding}
            onChange={(padding) => patch({ style: { heading: { padding } } })}
          />
        </Row>
        <Row label="Corner radius">
          <NumberField
            value={heading.radius}
            onChange={(radius) => patch({ style: { heading: { radius } } })}
            max={40}
            suffix="px"
          />
        </Row>
        <Row label="Space below">
          <NumberField
            value={heading.marginBottom}
            onChange={(marginBottom) =>
              patch({ style: { heading: { marginBottom } } })
            }
            max={60}
            suffix="px"
          />
        </Row>
        <Row label="Icon">
          <IconField
            value={heading.icon}
            onChange={(icon) => patch({ style: { heading: { icon } } })}
          />
        </Row>
      </Group>

      <Group title="Section box">
        <Row label="Fill">
          <FillField
            value={container.background}
            onChange={(background) =>
              patch({ style: { container: { background } } })
            }
          />
        </Row>
        <Row label="Border" stacked>
          <BorderField
            value={container.border}
            onChange={(border) => patch({ style: { container: { border } } })}
          />
        </Row>
        <Row label="Padding">
          <BoxField
            value={container.padding}
            onChange={(padding) => patch({ style: { container: { padding } } })}
          />
        </Row>
        <Row label="Corner radius">
          <NumberField
            value={container.radius}
            onChange={(radius) => patch({ style: { container: { radius } } })}
            max={40}
            suffix="px"
          />
        </Row>
      </Group>

      <Group title="Items">
        <Row label="Direction">
          <Segmented
            value={node.items.direction}
            onChange={(direction) => patch({ items: { direction } })}
            options={[
              { value: "column", label: "Stack" },
              { value: "row", label: "Row" },
            ]}
          />
        </Row>
        {node.items.direction === "row" && (
          <Row label="Wrap">
            <Segmented
              value={node.items.wrap ? "yes" : "no"}
              onChange={(v) => patch({ items: { wrap: v === "yes" } })}
              options={[
                { value: "yes", label: "Wrap" },
                { value: "no", label: "Fit" },
              ]}
            />
          </Row>
        )}
        <Row label="Grid columns" hint="Overrides direction">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="h-8 w-8 rounded border hover:bg-muted flex items-center justify-center"
              onClick={() =>
                patch({
                  items: {
                    columns: Math.max(1, (node.items.columns ?? 1) - 1) || null,
                  },
                })
              }
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[13px] w-8 text-center tabular-nums">
              {node.items.columns ?? "—"}
            </span>
            <button
              type="button"
              className="h-8 w-8 rounded border hover:bg-muted flex items-center justify-center"
              onClick={() =>
                patch({
                  items: {
                    columns: Math.min(6, (node.items.columns ?? 0) + 1),
                  },
                })
              }
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </Row>
        <Row label="Gap">
          <NumberField
            value={node.items.gap}
            onChange={(gap) => patch({ items: { gap } })}
            max={60}
            suffix="px"
          />
        </Row>
        <Row label="Item fill">
          <FillField
            value={itemBox.background}
            onChange={(background) =>
              patch({ style: { itemBox: { background } } })
            }
          />
        </Row>
        <Row label="Item border" stacked>
          <BorderField
            value={itemBox.border}
            onChange={(border) => patch({ style: { itemBox: { border } } })}
          />
        </Row>
        <Row label="Item padding">
          <BoxField
            value={itemBox.padding}
            onChange={(padding) => patch({ style: { itemBox: { padding } } })}
          />
        </Row>
        <Row label="Item radius">
          <NumberField
            value={itemBox.radius}
            onChange={(radius) => patch({ style: { itemBox: { radius } } })}
            max={40}
            suffix="px"
          />
        </Row>
      </Group>

      <Group title="Separator">
        <Row label="Between items">
          <Segmented
            value={separator.kind}
            onChange={(kind) => patch({ style: { separator: { kind } } })}
            options={[
              { value: "none", label: "—" },
              { value: "line", label: "Line" },
              { value: "dashed", label: "Dash" },
              { value: "space", label: "Space" },
            ]}
          />
        </Row>
        {separator.kind !== "none" && (
          <>
            {separator.kind !== "space" && (
              <>
                <Row label="Colour">
                  <ColorField
                    value={separator.color}
                    onChange={(color) =>
                      patch({ style: { separator: { color } } })
                    }
                  />
                </Row>
                <Row label="Thickness">
                  <NumberField
                    value={separator.thickness}
                    onChange={(thickness) =>
                      patch({ style: { separator: { thickness } } })
                    }
                    max={10}
                    suffix="px"
                  />
                </Row>
              </>
            )}
            <Row label="Spacing">
              <NumberField
                value={separator.spacing}
                onChange={(spacing) =>
                  patch({ style: { separator: { spacing } } })
                }
                max={40}
                suffix="px"
              />
            </Row>
          </>
        )}
      </Group>

      <Group title="Timeline">
        <Row label="Marker">
          <Segmented
            value={marker.kind}
            onChange={(kind) => patch({ style: { marker: { kind } } })}
            options={[
              { value: "none", label: "—" },
              { value: "dot", label: "●" },
              { value: "ring", label: "○" },
              { value: "square", label: "■" },
              { value: "bar", label: "▮" },
            ]}
          />
        </Row>
        {marker.kind !== "none" && (
          <>
            <Row label="Colour">
              <ColorField
                value={marker.color}
                onChange={(color) => patch({ style: { marker: { color } } })}
              />
            </Row>
            <Row label="Size">
              <NumberField
                value={marker.size}
                onChange={(size) => patch({ style: { marker: { size } } })}
                max={30}
                suffix="px"
              />
            </Row>
            <Row label="Offset">
              <NumberField
                value={marker.offset}
                onChange={(offset) => patch({ style: { marker: { offset } } })}
                min={-40}
                max={40}
                suffix="px"
              />
            </Row>
          </>
        )}
        <Row label="Rail" hint="Line running behind the markers">
          <Segmented
            value={marker.rail?.enabled ? "on" : "off"}
            onChange={(v) =>
              patch({
                style: {
                  marker: {
                    rail:
                      v === "on"
                        ? {
                            enabled: true,
                            color:
                              marker.rail?.color ?? doc.theme.colors.border,
                            width: marker.rail?.width ?? 2,
                          }
                        : null,
                  },
                },
              })
            }
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Row>
        {marker.rail?.enabled && (
          <>
            <Row label="Rail colour">
              <ColorField
                value={marker.rail.color}
                onChange={(color) =>
                  patch({
                    style: { marker: { rail: { ...marker.rail!, color } } },
                  })
                }
              />
            </Row>
            <Row label="Rail width">
              <NumberField
                value={marker.rail.width}
                onChange={(width) =>
                  patch({
                    style: { marker: { rail: { ...marker.rail!, width } } },
                  })
                }
                max={10}
                suffix="px"
              />
            </Row>
          </>
        )}
      </Group>
    </div>
  );
}
