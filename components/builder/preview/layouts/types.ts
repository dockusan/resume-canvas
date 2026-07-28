import { ResumeData, ResumeSettings, SectionConfig } from "@/lib/types";

export interface BaseSize {
  base: number;
  title: number;
  name: number;
}

/** Per-template, per-column styling passed into section renderers. */
export interface SectionStyleConfig {
  className?: string;
  headerClass?: string;
  headerStyle?: React.CSSProperties;
  textColor?: string;
  accentColor?: string;
  itemClass?: string;
  iconBg?: string;
  badgeBg?: string;
  rowLayout?: boolean;
  hideTimeline?: boolean;
}

/** PDF variant: react-pdf style objects instead of CSS/classNames. */
export interface PdfSectionStyleConfig {
  containerStyle?: Record<string, unknown>;
  headerStyle?: Record<string, unknown>;
  itemStyle?: Record<string, unknown>;
  textColor?: string;
  accentColor?: string;
  iconBg?: string;
  badgeBg?: string;
  rowLayout?: boolean;
  hideTimeline?: boolean;
}

export interface HtmlLayoutProps {
  resumeData: ResumeData;
  settings: ResumeSettings;
  photoBorderRadius: string;
  baseSize: BaseSize;
  renderSectionById: (
    section: SectionConfig,
    config?: SectionStyleConfig,
  ) => React.ReactNode;
}

export interface PdfLayoutProps {
  resumeData: ResumeData;
  settings: ResumeSettings;
  photoBorderRadius: number;
  baseSize: BaseSize;
  renderSectionById: (
    section: SectionConfig,
    config?: PdfSectionStyleConfig,
  ) => React.ReactNode;
}
