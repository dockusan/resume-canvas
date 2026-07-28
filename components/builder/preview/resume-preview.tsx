"use client";

import { EditingProvider } from "@/components/builder/inline/editing-context";
import { BuilderToolbar } from "@/components/builder/toolbar/builder-toolbar";
import { isCustomSectionId, useResumeStore } from "@/lib/store/useResumeStore";
import { SectionConfig } from "@/lib/types";
import { Download } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { RenderResume } from "./render-resume";

import { ClassicLayout } from "./layouts/html/ClassicLayout";
import { CreativeLayout } from "./layouts/html/CreativeLayout";
import { ExecutiveLayout } from "./layouts/html/ExecutiveLayout";
import { MinimalLayout } from "./layouts/html/MinimalLayout";
import { Modern1ColLayout } from "./layouts/html/Modern1ColLayout";
import { Modern2ColLayout } from "./layouts/html/Modern2ColLayout";
import { SectionStyleConfig } from "./layouts/types";

import { CertificationsSection } from "./sections/certifications-section";
import { CustomSectionRenderer } from "./sections/custom-section";
import { EducationSection } from "./sections/education-section";
import { ExperienceSection } from "./sections/experience-section";
import { LanguagesSection } from "./sections/languages-section";
import { ProjectsSection } from "./sections/projects-section";
import { SkillsSection } from "./sections/skills-section";
import { SocialsSection } from "./sections/socials-section";
import { StrengthsSection } from "./sections/strengths-section";
import { SummarySection } from "./sections/summary-section";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false },
);

export function ResumePreview() {
  const { resumeData, settings } = useResumeStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showPdf, setShowPdf] = useState(false);
  const [fitScale, setFitScale] = useState(1);
  const [paperHeight, setPaperHeight] = useState(0);

  // Fit-to-width: scale the paper down when the viewport is narrower than it.
  const paperPxWidth = settings.documentSize === "Letter" ? 816 : 794;
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const styles = getComputedStyle(el);
      const available =
        el.clientWidth -
        parseFloat(styles.paddingLeft) -
        parseFloat(styles.paddingRight);
      setFitScale(Math.min(1, available / paperPxWidth));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [paperPxWidth]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setPaperHeight(el.offsetHeight));
    observer.observe(el);
    setPaperHeight(el.offsetHeight);
    return () => observer.disconnect();
  }, [showPdf]);

  const handlePrint = async () => {
    setIsDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(
        <RenderResume resumeData={resumeData} settings={settings} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 100);
      };
    } catch (error) {
      console.error("Print failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      setDownloadProgress(10);
      const { pdf } = await import("@react-pdf/renderer");

      setDownloadProgress(30);
      const blob = await pdf(
        <RenderResume resumeData={resumeData} settings={settings} />,
      ).toBlob();

      setDownloadProgress(80);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("PDF generation failed", error);
    } finally {
      setIsDownloading(false);
      setTimeout(() => setDownloadProgress(0), 200);
    }
  };

  const { width, minHeight } =
    settings.documentSize === "Letter"
      ? { width: "215.9mm", minHeight: "279.4mm" }
      : { width: "210mm", minHeight: "297mm" };

  const getBaseStyles = (fontSize: "sm" | "md" | "lg" | "xl") => {
    // PDF points: sm:8, md:10, lg:12, xl:14
    // We scale by 1.333 to match px roughly
    const scale = 1.333;
    switch (fontSize) {
      case "sm":
        return { base: 8 * scale, title: 10 * scale, name: 20 * scale };
      case "lg":
        return { base: 12 * scale, title: 14 * scale, name: 28 * scale };
      case "xl":
        return { base: 14 * scale, title: 16 * scale, name: 28 * scale };
      case "md":
      default:
        return { base: 10 * scale, title: 12 * scale, name: 24 * scale };
    }
  };
  const baseSize = getBaseStyles(settings.fontSize || "md");

  const getPhotoBorderRadius = () => {
    switch (settings.photoStyle) {
      case "square":
        return "0px";
      case "rounded":
        return "12px";
      case "circle":
      default:
        return "9999px";
    }
  };
  const photoBorderRadius = getPhotoBorderRadius();

  const renderSectionById = (
    section: SectionConfig,
    config?: SectionStyleConfig,
  ) => {
    const props = { section, config, baseSize };
    if (isCustomSectionId(section.id)) {
      return <CustomSectionRenderer key={section.id} {...props} />;
    }
    switch (section.id) {
      case "summary":
        return <SummarySection key={section.id} {...props} />;
      case "experience":
        return <ExperienceSection key={section.id} {...props} />;
      case "education":
        return <EducationSection key={section.id} {...props} />;
      case "projects":
        return <ProjectsSection key={section.id} {...props} />;
      case "strengths":
        return <StrengthsSection key={section.id} {...props} />;
      case "skills":
        return <SkillsSection key={section.id} {...props} />;
      case "socials":
        return <SocialsSection key={section.id} {...props} />;
      case "languages":
        return <LanguagesSection key={section.id} {...props} />;
      case "certifications":
        return <CertificationsSection key={section.id} {...props} />;
      default:
        return null;
    }
  };

  // Layout builders by template

  const renderLayout = () => {
    const layoutProps = {
      resumeData,
      settings,
      photoBorderRadius,
      baseSize,
      renderSectionById,
    };

    switch (settings.template) {
      case "minimal":
        return <MinimalLayout {...layoutProps} />;
      case "modern":
        return <Modern1ColLayout {...layoutProps} />;
      case "modern-2col":
        return <Modern2ColLayout {...layoutProps} />;
      case "executive":
        return <ExecutiveLayout {...layoutProps} />;
      case "creative":
        return <CreativeLayout {...layoutProps} />;
      case "classic":
      default:
        return <ClassicLayout {...layoutProps} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted relative">
      {isDownloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[300px] border border-border">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin" />
              <Download className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center w-full">
              <h3 className="text-lg font-bold">Generating PDF</h3>
              <div className="w-full bg-muted overflow-hidden h-2.5 mt-3 ">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BuilderToolbar
        showPdf={showPdf}
        onTogglePdf={() => setShowPdf(!showPdf)}
        onPrint={handlePrint}
        onDownload={handleDownloadPdf}
        isDownloading={isDownloading}
      />

      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-muted/30"
      >
        {showPdf ? (
          <div className="h-full w-full max-w-4xl shadow-2xl">
            <PDFViewer
              className="w-full h-full rounded-md border"
              showToolbar={true}
            >
              <RenderResume resumeData={resumeData} settings={settings} />
            </PDFViewer>
          </div>
        ) : (
          <EditingProvider editable>
            <div
              style={{
                width: paperPxWidth * fitScale,
                height: paperHeight ? paperHeight * fitScale : undefined,
              }}
            >
              <div
                ref={contentRef}
                className="bg-white origin-top-left shadow-xl flex flex-col overflow-hidden"
                style={{
                  fontFamily: settings.fontFamily,
                  width,
                  minHeight,
                  color: "#333",
                  transform: `scale(${fitScale})`,
                }}
              >
                {renderLayout()}
              </div>
            </div>
          </EditingProvider>
        )}
      </div>
    </div>
  );
}
