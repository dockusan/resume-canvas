"use client";

import { PERSONAL_CONTACT_FIELDS } from "@/lib/personal-fields";
import { useDocument } from "@/lib/schema/use-document";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import {
  BorderField,
  BoxField,
  FillField,
  Group,
  NumberField,
  Row,
  Segmented,
} from "./controls";

/** The name / contact / portrait block at the top of the document. */
export function HeaderPanel() {
  const doc = useDocument();
  const updateLayout = useResumeStore((s) => s.updateLayout);
  const updateSettings = useResumeStore((s) => s.updateSettings);
  const settings = useResumeStore((s) => s.settings);
  const header = doc.layout.header;
  const twoCol = doc.layout.columns === 2;

  return (
    <div className="px-3">
      <Group title="Placement">
        {twoCol && (
          <Row label="Sits in">
            <Segmented
              value={header.placement}
              onChange={(placement) => updateLayout({ header: { placement } })}
              options={[
                { value: "band", label: "Full width" },
                { value: "left", label: "Left" },
                { value: "right", label: "Right" },
              ]}
            />
          </Row>
        )}
        <Row label="Arrangement">
          <Segmented
            value={header.direction}
            onChange={(direction) => updateLayout({ header: { direction } })}
            options={[
              { value: "row", label: "Side by side" },
              { value: "column", label: "Stacked" },
            ]}
          />
        </Row>
        <Row label="Align">
          <Segmented
            value={header.align}
            onChange={(align) => updateLayout({ header: { align } })}
            options={[
              { value: "left", label: "L" },
              { value: "center", label: "C" },
              { value: "right", label: "R" },
            ]}
          />
        </Row>
        <Row label="Fill">
          <FillField
            value={header.background}
            onChange={(background) => updateLayout({ header: { background } })}
          />
        </Row>
        <Row label="Padding">
          <BoxField
            value={header.padding}
            onChange={(padding) => updateLayout({ header: { padding } })}
          />
        </Row>
        <Row label="Border" stacked>
          <BorderField
            value={header.border}
            onChange={(border) => updateLayout({ header: { border } })}
          />
        </Row>
      </Group>

      <Group title="Photo">
        <Row label="Show">
          <Segmented
            value={header.photo.visible ? "on" : "off"}
            onChange={(v) => {
              updateLayout({ header: { photo: { visible: v === "on" } } });
              updateSettings({ showPhoto: v === "on" });
            }}
            options={[
              { value: "off", label: "Hidden" },
              { value: "on", label: "Shown" },
            ]}
          />
        </Row>
        {header.photo.visible && (
          <>
            <Row label="Shape">
              <Segmented
                value={header.photo.shape}
                onChange={(shape) => {
                  updateLayout({ header: { photo: { shape } } });
                  updateSettings({ photoStyle: shape });
                }}
                options={[
                  { value: "square", label: "▢" },
                  { value: "rounded", label: "▢˖" },
                  { value: "circle", label: "◯" },
                ]}
              />
            </Row>
            <Row label="Size">
              <NumberField
                value={header.photo.size}
                onChange={(size) =>
                  updateLayout({ header: { photo: { size } } })
                }
                min={32}
                max={220}
                suffix="px"
              />
            </Row>
            {twoCol && (
              <Row label="Position" hint="Beside the name, or atop a column">
                <Segmented
                  value={header.photo.slot}
                  onChange={(slot) =>
                    updateLayout({ header: { photo: { slot } } })
                  }
                  options={[
                    { value: "header", label: "Header" },
                    { value: "left", label: "Left" },
                    { value: "right", label: "Right" },
                  ]}
                />
              </Row>
            )}
            <Row label="Rotation">
              <NumberField
                value={header.photo.rotate}
                onChange={(rotate) =>
                  updateLayout({ header: { photo: { rotate } } })
                }
                min={-45}
                max={45}
                suffix="°"
              />
            </Row>
            <Row label="Border" stacked>
              <BorderField
                value={header.photo.border}
                onChange={(border) =>
                  updateLayout({ header: { photo: { border } } })
                }
              />
            </Row>
          </>
        )}
      </Group>

      <Group title="Contacts">
        <Row label="Direction">
          <Segmented
            value={header.contacts.direction}
            onChange={(direction) =>
              updateLayout({ header: { contacts: { direction } } })
            }
            options={[
              { value: "row", label: "Row" },
              { value: "column", label: "Stack" },
            ]}
          />
        </Row>
        <Row label="Gap">
          <NumberField
            value={header.contacts.gap}
            onChange={(gap) => updateLayout({ header: { contacts: { gap } } })}
            max={48}
            suffix="px"
          />
        </Row>
        <Row label="Icons">
          <Segmented
            value={header.contacts.showIcons ? "on" : "off"}
            onChange={(v) => {
              updateLayout({
                header: { contacts: { showIcons: v === "on" } },
              });
              updateSettings({ showContactIcons: v === "on" });
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Row>
        {header.contacts.showIcons && (
          <Row label="Icon side">
            <Segmented
              value={header.contacts.iconPosition}
              onChange={(iconPosition) =>
                updateLayout({ header: { contacts: { iconPosition } } })
              }
              options={[
                { value: "before", label: "Before" },
                { value: "after", label: "After" },
              ]}
            />
          </Row>
        )}
      </Group>

      <Group title="Fields">
        {PERSONAL_CONTACT_FIELDS.map(({ field, label }) => {
          const visible = settings.personalFieldVisibility?.[field] !== false;
          return (
            <button
              key={field}
              type="button"
              onClick={() =>
                updateSettings({
                  personalFieldVisibility: {
                    ...settings.personalFieldVisibility,
                    [field]: !visible,
                  },
                })
              }
              className="w-full flex items-center justify-between rounded px-1 py-0.5 hover:bg-muted"
            >
              <span className={cn("text-xs", !visible && "opacity-50")}>
                {label}
              </span>
              {visible ? (
                <Eye className="w-3.5 h-3.5 text-sky-600" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </Group>
    </div>
  );
}
