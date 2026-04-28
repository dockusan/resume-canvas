import { ResumeData, ResumeSettings } from "@/lib/types";

export interface HtmlLayoutProps {
  resumeData: ResumeData;
  settings: ResumeSettings;
  photoBorderRadius: string;
  baseSize: { base: number; title: number; name: number };
  renderSectionById: (id: string, customConfig?: any) => React.ReactNode;
}

export interface PdfLayoutProps {
  resumeData: ResumeData;
  settings: ResumeSettings;
  photoBorderRadius: number;
  baseSize: { base: number; title: number; name: number };
  renderSectionById: (id: string, customConfig?: any) => React.ReactNode;
}
