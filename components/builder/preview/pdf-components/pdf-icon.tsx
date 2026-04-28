import { pdfIconPack } from "@/lib/pdf-icons";
import {
  Circle,
  Ellipse,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Svg,
} from "@react-pdf/renderer";

export const PdfIcon = ({
  name,
  size = 12,
  color = "#3e3e3e",
  style,
  fill = "none",
}: {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  fill?: string;
}) => {
  let iconNodes = pdfIconPack[name];
  if (!iconNodes) {
    const key = Object.keys(pdfIconPack).find(
      (k) => k.toLowerCase() === name.toLowerCase(),
    );
    if (key) iconNodes = pdfIconPack[key];
  }
  if (!iconNodes) iconNodes = pdfIconPack["Globe"];
  if (!iconNodes) return null;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {iconNodes.map((node: any, index: number) => {
        const [tag, attrs] = node;
        const Component = {
          path: Path,
          circle: Circle,
          line: Line,
          polyline: Polyline,
          rect: Rect,
          polygon: Polygon,
          ellipse: Ellipse,
        }[tag as string] as any;
        if (!Component) return null;
        const { key: _ignoredKey, ...safeAttrs } = attrs || {};
        return <Component key={index} {...safeAttrs} fill={fill} />;
      })}
    </Svg>
  );
};
