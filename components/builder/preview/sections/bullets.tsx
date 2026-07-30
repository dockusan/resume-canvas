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
  if (!bulletStyle || bulletStyle === "none") {
    return (
      <p
        className="whitespace-pre-line leading-relaxed"
        style={{ color: textColor, fontSize }}
      >
        {description}
      </p>
    );
  }
  const items = description
    .split("\n")
    .filter((item) => item.trim().length > 0);
  return (
    <ul className="space-y-0.5 mt-1">
      {items.map((item, index) => (
        <li
          key={index}
          className="leading-relaxed flex items-start gap-1"
          style={{ color: textColor, fontSize }}
        >
          <span
            className="shrink-0 w-3 h-[1.625em] flex items-center justify-center opacity-80"
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
