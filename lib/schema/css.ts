/**
 * Schema → CSS. Every visual value in the document resolves to plain inline
 * styles here, which is what makes the same tree usable for the preview, the
 * print page and (later) the server PDF route.
 */

import type { CSSProperties } from "react";
import {
  BorderSpec,
  Box,
  BoxStyle,
  Fill,
  FontSpec,
  HeadingStyle,
  ItemLayout,
  PAGE_DIMENSIONS,
  PageSpec,
  SeparatorStyle,
  Theme,
  fontSizeAt,
} from "./document";

export function fillToCss(fill: Fill | null | undefined): string | undefined {
  if (!fill || fill.type === "none") return undefined;
  if (fill.type === "solid") return fill.color;
  return `linear-gradient(${fill.angle}deg, ${fill.from}, ${fill.to})`;
}

export function fillStyle(fill: Fill | null | undefined): CSSProperties {
  const value = fillToCss(fill);
  if (!value) return {};
  return fill?.type === "gradient"
    ? { backgroundImage: value }
    : { backgroundColor: value };
}

/** Parse #rgb / #rrggbb / rgb() / rgba() to 0-255 channels. */
function parseColor(color: string): [number, number, number] | null {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  }
  const rgb = color.match(/rgba?\(([^)]+)\)/i);
  if (rgb) {
    const parts = rgb[1].split(",").map((p) => parseFloat(p));
    if (parts.length >= 3) return [parts[0], parts[1], parts[2]];
  }
  return null;
}

/** WCAG relative luminance, 0 (black) → 1 (white). */
export function luminance(color: string): number {
  const rgb = parseColor(color);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, 1 (identical) to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Whether a surface needs light text. Presence of a fill is not enough —
 * Creative's sidebar is near-white, so "filled therefore dark" would render
 * white-on-white.
 */
export function isDarkFill(fill: Fill | null | undefined): boolean {
  if (!fill || fill.type === "none") return false;
  const color = fill.type === "solid" ? fill.color : fill.from;
  return luminance(color) < 0.5;
}

export function padding(b: Box): CSSProperties {
  return {
    paddingTop: b.top,
    paddingRight: b.right,
    paddingBottom: b.bottom,
    paddingLeft: b.left,
  };
}

export function borderStyle(spec: BorderSpec | null): CSSProperties {
  if (!spec || spec.width <= 0) return {};
  const line = `${spec.width}px ${spec.style} ${spec.color}`;
  const out: CSSProperties = {};
  if (spec.sides.top) out.borderTop = line;
  if (spec.sides.right) out.borderRight = line;
  if (spec.sides.bottom) out.borderBottom = line;
  if (spec.sides.left) out.borderLeft = line;
  return out;
}

export function fontStyle(f: FontSpec): CSSProperties {
  return {
    fontFamily: f.family === "inherit" ? undefined : f.family,
    fontWeight: f.weight,
    letterSpacing: f.letterSpacing ? `${f.letterSpacing}px` : undefined,
    lineHeight: f.lineHeight,
    textTransform: f.transform === "none" ? undefined : f.transform,
  };
}

export function boxStyle(b: BoxStyle): CSSProperties {
  return {
    ...padding(b.padding),
    ...fillStyle(b.background),
    ...borderStyle(b.border),
    borderRadius: b.radius || undefined,
    boxShadow: b.shadow || undefined,
    gap: b.gap || undefined,
  };
}

export function headingStyle(h: HeadingStyle, theme: Theme): CSSProperties {
  // "inherit" on a section heading means "use the theme's heading face", not
  // "use whatever the page is set in". Without this every paired choice —
  // Merriweather over Inter, Playfair over Source Sans — rendered its headings
  // in the body font, so half the picker produced identical documents.
  const font =
    h.font.family === "inherit"
      ? { ...h.font, family: theme.fonts.heading.family }
      : h.font;

  const base: CSSProperties = {
    ...fontStyle(font),
    fontSize: fontSizeAt(theme, h.step),
    color: h.color,
    ...fillStyle(h.background),
    ...borderStyle(h.border),
    ...padding(h.padding),
    borderRadius: h.radius || undefined,
    textAlign: h.align,
    marginBottom: h.marginBottom,
  };
  // A pill or boxed heading must shrink-wrap its text; underline spans the
  // column so the rule runs the full width.
  if (h.variant === "pill" || h.variant === "boxed") {
    base.display = "inline-block";
  } else {
    base.display = "block";
  }
  return base;
}

export function separatorStyle(s: SeparatorStyle): CSSProperties {
  if (s.kind === "none") return {};
  if (s.kind === "space") return { paddingTop: s.spacing };
  return {
    borderTop: `${s.thickness}px ${
      s.kind === "line" ? "solid" : s.kind
    } ${s.color}`,
    paddingTop: s.spacing,
    marginTop: s.spacing,
  };
}

/**
 * A separator between entries laid out in a *row* (header contacts): the rule
 * runs down the leading edge instead of across the top, so contacts stay on
 * one line rather than each dropping below a horizontal rule.
 */
export function inlineSeparatorStyle(s: SeparatorStyle): CSSProperties {
  if (s.kind === "none") return {};
  if (s.kind === "space") return { paddingLeft: s.spacing };
  return {
    borderLeft: `${s.thickness}px ${s.kind === "line" ? "solid" : s.kind} ${
      s.color
    }`,
    paddingLeft: s.spacing,
  };
}

export function itemLayoutStyle(l: ItemLayout): CSSProperties {
  if (l.columns && l.columns > 1) {
    return {
      display: "grid",
      gridTemplateColumns: `repeat(${l.columns}, minmax(0, 1fr))`,
      gap: l.gap,
      alignItems: l.align === "stretch" ? "stretch" : l.align,
    };
  }
  const justifyMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between",
  } as const;
  return {
    display: "flex",
    flexDirection: l.direction === "row" ? "row" : "column",
    flexWrap: l.wrap ? "wrap" : "nowrap",
    gap: l.gap,
    alignItems:
      l.align === "stretch"
        ? l.direction === "row"
          ? "center"
          : "stretch"
        : l.align === "start"
          ? "flex-start"
          : l.align === "end"
            ? "flex-end"
            : "center",
    justifyContent: justifyMap[l.justify],
  };
}

export function pageBoxStyle(page: PageSpec): CSSProperties {
  const dims = PAGE_DIMENSIONS[page.size];
  return {
    width: dims.width,
    minHeight: dims.height,
    ...fillStyle(page.background),
  };
}

export function pageDimensions(page: PageSpec) {
  return PAGE_DIMENSIONS[page.size];
}

/** Usable content height once page margins are removed. */
export function contentHeight(page: PageSpec): number {
  return (
    PAGE_DIMENSIONS[page.size].height - page.margin.top - page.margin.bottom
  );
}

export function contentWidth(page: PageSpec): number {
  return (
    PAGE_DIMENSIONS[page.size].width - page.margin.left - page.margin.right
  );
}
