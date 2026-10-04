"use client";

import {
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  Diamond,
  Dot,
  Minus,
  Square,
  Star,
} from "lucide-react";

const TYPED_BULLET = /^\s*[•\-*◦▪]\s+/;

/**
 * The bullet style to render with. Descriptions whose lines were typed with
 * their own "•" / "-" markers (and older saves with no style at all) become
 * a real list instead of a paragraph of hand-typed glyphs.
 */
export function effectiveBulletStyle(
  description: string,
  bulletStyle?: string,
): string {
  if (bulletStyle) return bulletStyle;
  const lines = description.split("\n").filter((l) => l.trim());
  return lines.length > 0 && lines.every((l) => TYPED_BULLET.test(l))
    ? "default"
    : "none";
}

export function getBulletIcon(style: string) {
  switch (style) {
    case "Circle":
      return <Circle className="w-1.5 h-1.5" />;
    case "Square":
      return <Square className="w-1.5 h-1.5 fill-current" />;
    case "Check":
      return <Check className="w-3 h-3" />;
    case "ArrowRight":
      return <ArrowRight className="w-3 h-3" />;
    case "ChevronRight":
      return <ChevronRight className="w-3 h-3" />;
    case "Diamond":
      return <Diamond className="w-2 h-2 fill-current" />;
    case "Star":
      return <Star className="w-2.5 h-2.5 fill-current" />;
    case "Minus":
      return <Minus className="w-3 h-3" />;
    case "default":
    default:
      return <Dot className="w-1.5 h-1.5 fill-current" />;
  }
}

interface RenderDescriptionProps {
  description: string;
  bulletStyle?: string;
  textColor?: string;
  fontSize: number;
}

export function RenderDescription({
  description,
  bulletStyle,
  textColor = "#3e3e3e",
  fontSize,
}: RenderDescriptionProps) {
  if (!description) return null;
  bulletStyle = effectiveBulletStyle(description, bulletStyle);
  if (bulletStyle === "none") {
    return (
      <p className="whitespace-pre-line" style={{ color: textColor, fontSize }}>
        {description}
      </p>
    );
  }
  const items = description
    .split("\n")
    .filter((item) => item.trim().length > 0);
  return (
    <ul
      className="flex flex-col"
      style={{
        gap: "var(--rc-bullet-gap, 2px)",
        marginTop: "calc(var(--rc-bullet-gap, 2px) * 2)",
      }}
    >
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-1"
          style={{ color: textColor, fontSize }}
        >
          <span
            className="shrink-0 w-3 h-[1lh] flex items-center justify-center opacity-80"
            style={{ color: textColor }}
          >
            {getBulletIcon(bulletStyle)}
          </span>
          <span>{item.replace(/^[•\-\*•◦▪]\s*/, "")}</span>
        </li>
      ))}
    </ul>
  );
}
