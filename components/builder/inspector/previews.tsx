"use client";

import { DocumentPreset } from "@/lib/schema/document";
import { fillToCss, isDarkFill } from "@/lib/schema/css";

/**
 * Miniature renditions used on the option cards. Deliberately hand-drawn
 * rather than a real render of the section: they need to read at 60×28px.
 */

const LINES = (n: number, className = "bg-current/25") => (
  <div className="w-full space-y-[3px]">
    {Array.from({ length: n }, (_, i) => (
      <div
        key={i}
        className={`h-[2px] rounded-full ${className}`}
        style={{ width: `${100 - i * 14}%` }}
      />
    ))}
  </div>
);

export function HeadingPreview({ look }: { look: string }) {
  const label = <div className="h-[3px] w-6 rounded-full bg-current/70" />;
  const frame = "w-full px-1.5 flex flex-col gap-[3px] text-foreground";

  switch (look) {
    case "plain":
      return (
        <div className={frame}>
          {label}
          {LINES(2)}
        </div>
      );
    case "underline":
      return (
        <div className={frame}>
          <div className="pb-[2px] border-b border-current/30">{label}</div>
          {LINES(2)}
        </div>
      );
    case "accent-rule":
      return (
        <div className={frame}>
          <div className="pb-[2px] border-b-2 border-primary">{label}</div>
          {LINES(2)}
        </div>
      );
    case "side-rule":
      return (
        <div className={frame}>
          <div className="pl-1 border-l-2 border-primary">{label}</div>
          {LINES(2)}
        </div>
      );
    case "pill":
      return (
        <div className={frame}>
          <div className="w-8 rounded-full bg-primary py-[3px] px-1">
            <div className="h-[3px] w-4 rounded-full bg-primary-foreground/90" />
          </div>
          {LINES(2)}
        </div>
      );
    case "boxed":
      return (
        <div className={frame}>
          <div className="w-9 rounded-[2px] border border-current/40 py-[3px] px-1">
            {label}
          </div>
          {LINES(2)}
        </div>
      );
    default:
      return null;
  }
}

export function TimelinePreview({ look }: { look: string }) {
  const rows = [0, 1];
  return (
    <div className="w-full px-2 flex flex-col gap-[6px] text-foreground">
      {rows.map((r) => (
        <div key={r} className="relative flex items-start gap-1.5">
          {look === "rail" || look === "dots-rail" ? (
            <span className="absolute left-[2px] top-0 bottom-[-6px] w-[1.5px] bg-current/25" />
          ) : null}
          {look === "dots" || look === "dots-rail" ? (
            <span className="relative z-10 mt-[1px] h-[5px] w-[5px] shrink-0 rounded-full bg-primary" />
          ) : (
            <span className="w-[5px] shrink-0" />
          )}
          <div className="flex-1 space-y-[2px]">
            <div className="h-[2px] w-3/4 rounded-full bg-current/50" />
            <div className="h-[2px] w-1/2 rounded-full bg-current/25" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DividerPreview({ look }: { look: string }) {
  const rule =
    look === "none" ? null : look === "space" ? (
      <div className="h-[6px]" />
    ) : (
      <div
        className={`h-0 w-full border-t border-current/35 ${
          look === "dashed" ? "border-dashed" : ""
        }`}
      />
    );
  return (
    <div className="w-full px-2 flex flex-col gap-[3px] text-foreground">
      {LINES(1, "bg-current/50")}
      {rule}
      {LINES(1, "bg-current/50")}
    </div>
  );
}

export function DensityPreview({ look }: { look: string }) {
  const gap = look === "compact" ? 2 : look === "relaxed" ? 7 : 4;
  return (
    <div className="w-full px-2 flex flex-col text-foreground" style={{ gap }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[2px] w-full rounded-full bg-current/35" />
      ))}
    </div>
  );
}

export function ColumnsPreview({ ratio }: { ratio: number | null }) {
  return (
    <div className="flex h-6 w-9 gap-[2px] rounded-[2px] border border-current/30 p-[2px] text-foreground">
      {ratio === null ? (
        <div className="flex-1 rounded-[1px] bg-current/25" />
      ) : (
        <>
          <div
            className="rounded-[1px] bg-current/25"
            style={{ flex: ratio }}
          />
          <div
            className="rounded-[1px] bg-primary/40"
            style={{ flex: 1 - ratio }}
          />
        </>
      )}
    </div>
  );
}

/**
 * A miniature of a whole template, drawn from the preset's own data.
 *
 * Generated rather than hand-drawn per template, so it stays truthful if a
 * preset's columns, fills, header placement or heading style change — and a
 * new preset gets a thumbnail for free.
 */
export function TemplatePreview({ preset }: { preset: DocumentPreset }) {
  const { layout, theme } = preset;
  const twoCol = layout.columns === 2;
  const leftPct = twoCol ? layout.ratio * 100 : 100;
  const band = layout.header.placement === "band";
  const pageDecor = layout.decorations.filter((d) => d.target === "page");

  const marks = (side: "left" | "right") => {
    const onFill = isDarkFill(layout.fills[side]);
    const style = preset.sectionStyle[side]?.heading;
    const accent = theme.colors.accent;
    const line = onFill ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.22)";

    const heading = (() => {
      if (!style) return null;
      if (style.variant === "pill") {
        return (
          <span
            className="block h-[4px] w-[16px] rounded-full"
            style={{ background: fillToCss(style.background) ?? accent }}
          />
        );
      }
      if (style.variant === "boxed") {
        return (
          <span
            className="block h-[5px] w-[18px] rounded-[1px] border"
            style={{ borderColor: style.border?.color ?? accent }}
          />
        );
      }
      return (
        <span
          className="block h-[3px] w-[14px]"
          style={{
            background: onFill ? "rgba(255,255,255,0.75)" : accent,
            borderBottom:
              style.variant === "underline"
                ? `1px solid ${style.border?.color ?? accent}`
                : undefined,
          }}
        />
      );
    })();

    return (
      <div className="flex flex-col gap-[3px] p-[4px]">
        {heading}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-[1.5px] rounded-full"
            style={{ background: line, width: `${92 - i * 16}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className="relative flex h-[46px] w-[36px] flex-col overflow-hidden rounded-[3px] border"
      style={{ background: fillToCss(preset.page.background) ?? "#fff" }}
    >
      {pageDecor.map((d, i) => (
        <span
          key={i}
          className="absolute left-0 right-0 top-0"
          style={{ height: 2, background: fillToCss(d.fill) }}
        />
      ))}
      {band && (
        <div
          className="flex shrink-0 items-center gap-[2px] px-[4px]"
          style={{
            height: 11,
            background: fillToCss(layout.header.background) ?? "transparent",
          }}
        >
          {layout.header.photo.visible && (
            <span
              className="block size-[5px] rounded-full"
              style={{
                background: isDarkFill(layout.header.background)
                  ? "rgba(255,255,255,0.6)"
                  : "rgba(0,0,0,0.2)",
              }}
            />
          )}
          <span
            className="block h-[3px] w-[12px] rounded-full"
            style={{
              background: isDarkFill(layout.header.background)
                ? "rgba(255,255,255,0.85)"
                : "rgba(0,0,0,0.45)",
            }}
          />
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <div
          className="relative"
          style={{
            width: `${leftPct}%`,
            background: fillToCss(layout.fills.left) ?? "transparent",
          }}
        >
          {marks("left")}
        </div>
        {twoCol && (
          <div
            className="relative flex-1"
            style={{
              background: fillToCss(layout.fills.right) ?? "transparent",
            }}
          >
            {marks("right")}
          </div>
        )}
      </div>
    </div>
  );
}
