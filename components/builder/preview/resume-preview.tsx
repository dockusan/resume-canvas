"use client";

import { Button } from "@/components/ui/button";
import { getIconComponent } from "@/lib/icons";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { Social } from "@/lib/types";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  Diamond,
  Dot,
  Download,
  ExternalLink,
  Globe,
  Minus,
  Moon,
  Printer,
  Square,
  Star,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { RenderResume } from "./render-resume";

import { ClassicLayout } from "./layouts/html/ClassicLayout";
import { CreativeLayout } from "./layouts/html/CreativeLayout";
import { ExecutiveLayout } from "./layouts/html/ExecutiveLayout";
import { MinimalLayout } from "./layouts/html/MinimalLayout";
import { Modern1ColLayout } from "./layouts/html/Modern1ColLayout";
import { Modern2ColLayout } from "./layouts/html/Modern2ColLayout";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false },
);

export function ResumePreview() {
  const { resumeData, settings } = useResumeStore();
  const { theme, setTheme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showPdf, setShowPdf] = useState(false);

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

  const getSocialIcon = (social: Social) => {
    const iconName = social.icon || social.platform;
    const Icon = getIconComponent(iconName);
    return Icon ? <Icon className="w-4 h-4" /> : <Globe className="w-4 h-4" />;
  };

  const getBulletIcon = (style: string) => {
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
  };

  const renderDescription = (
    description: string,
    bulletStyle?: string,
    textColor = "#3e3e3e",
  ) => {
    if (!description) return null;
    if (!bulletStyle || bulletStyle === "none") {
      return (
        <p
          className="whitespace-pre-line leading-relaxed"
          style={{ color: textColor, fontSize: baseSize.base }}
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
            style={{ color: textColor, fontSize: baseSize.base }}
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
  };

  // SECTION RENDERING METHODS (extracted for reuse across templates)
  const renderSummary = (customConfig?: any) => {
    if (!resumeData.personalInfo.summary) return null;
    return (
      <section key="summary" className={customConfig?.className}>
        <h2
          className={customConfig?.headerClass}
          style={customConfig?.headerStyle}
        >
          Summary
        </h2>
        <p
          className="leading-relaxed text-justify"
          style={{
            color: customConfig?.textColor || "#3e3e3e",
            fontSize: baseSize.base,
          }}
        >
          {resumeData.personalInfo.summary}
        </p>
      </section>
    );
  };

  const renderExperience = (customConfig?: any) => {
    if (resumeData.experience.length === 0) return null;
    const textColor = customConfig?.textColor || "#3e3e3e";
    const accentColor = customConfig?.accentColor || "#008cff";
    return (
      <section key="experience" className={customConfig?.className}>
        <h2
          className={customConfig?.headerClass}
          style={customConfig?.headerStyle}
        >
          Work Experience
        </h2>
        <div className="space-y-4">
          {resumeData.experience.map((exp) => (
            <div
              key={exp.id}
              className={`relative pt-1 ${customConfig?.itemClass || "border-l-2 border-[#e5e7eb] pl-3 ml-1"}`}
            >
              {!customConfig?.hideTimeline && (
                <div className="absolute -left-[5px] top-2.5 w-2 h-2 rounded-full bg-[#d1d5db]" />
              )}
              <div className="flex justify-between items-baseline mb-0.5">
                <h3
                  className="font-medium"
                  style={{ color: textColor, fontSize: baseSize.title }}
                >
                  {exp.title}
                </h3>
                <span
                  className="font-medium whitespace-nowrap ml-2 opacity-80"
                  style={{ color: textColor, fontSize: baseSize.base - 3 }}
                >
                  {exp.startDate} / {exp.current ? "Present" : exp.endDate}
                </span>
              </div>
              <div
                className="font-medium mb-1"
                style={{ color: accentColor, fontSize: baseSize.base - 2 }}
              >
                {exp.company} • {exp.location}
              </div>
              {renderDescription(exp.description, exp.bulletStyle, textColor)}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderEducation = (customConfig?: any) => {
    if (resumeData.education.length === 0) return null;
    const textColor = customConfig?.textColor || "#3e3e3e";
    const accentColor = customConfig?.accentColor || "#008cff";
    return (
      <section key="education" className={customConfig?.className}>
        <h2
          className={customConfig?.headerClass}
          style={customConfig?.headerStyle}
        >
          Education
        </h2>
        <div className="space-y-3">
          {resumeData.education.map((edu) => (
            <div
              key={edu.id}
              className={
                customConfig?.itemClass ||
                "border-b border-[#f3f4f6] pb-2 last:border-0 last:pb-0"
              }
            >
              <div className="flex justify-between items-baseline mb-0.5">
                <h3
                  className="font-medium"
                  style={{ color: textColor, fontSize: baseSize.title }}
                >
                  {edu.degree}
                </h3>
                <span
                  className="font-medium whitespace-nowrap ml-2 opacity-80"
                  style={{ color: textColor, fontSize: baseSize.base - 3 }}
                >
                  {edu.startDate} / {edu.current ? "Present" : edu.endDate}
                </span>
              </div>
              <div
                className="font-medium"
                style={{ color: accentColor, fontSize: baseSize.base }}
              >
                {edu.school}, {edu.location}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderProjects = (customConfig?: any) => {
    if (resumeData.projects.length === 0) return null;
    const textColor = customConfig?.textColor || "#3e3e3e";
    const accentColor = customConfig?.accentColor || "#008cff";
    return (
      <section key="projects" className={customConfig?.className}>
        <h2
          className={customConfig?.headerClass}
          style={customConfig?.headerStyle}
        >
          Projects
        </h2>
        <div className="space-y-3">
          {resumeData.projects.map((project) => (
            <div key={project.id} className={customConfig?.itemClass}>
              <div className="flex justify-between items-baseline mb-0.5">
                <h3
                  className="font-medium flex items-center gap-2"
                  style={{ color: textColor, fontSize: baseSize.title }}
                >
                  {project.name}
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      className="opacity-50 hover:opacity-100"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </h3>
                <span
                  className="font-medium whitespace-nowrap ml-2 opacity-80"
                  style={{ color: textColor, fontSize: baseSize.base - 3 }}
                >
                  {project.date}
                </span>
              </div>
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block mb-1 hover:underline line-clamp-1"
                  style={{ color: accentColor, fontSize: baseSize.base - 2 }}
                >
                  {project.link}
                </a>
              )}
              <p
                className="whitespace-pre-line leading-relaxed"
                style={{ color: textColor, fontSize: baseSize.base - 2 }}
              >
                {project.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderStrengths = (customConfig?: any) => {
    if (resumeData.strengths.length === 0) return null;
    const textColor = customConfig?.textColor || "#3e3e3e";
    return (
      <section key="strengths" className={customConfig?.className}>
        <h2
          className={customConfig?.headerClass}
          style={customConfig?.headerStyle}
        >
          Strengths
        </h2>
        <div className="space-y-3">
          {resumeData.strengths.map((strength) => (
            <div
              key={strength.id}
              className={`flex gap-2 ${customConfig?.itemClass || ""}`}
            >
              {(() => {
                const Icon = strength.icon
                  ? getIconComponent(strength.icon)
                  : null;
                return Icon ? (
                  <Icon
                    className={`size-7 shrink-0 mt-0.5 p-1.5 rounded-md`}
                    style={{
                      color: textColor,
                      backgroundColor:
                        customConfig?.iconBg || "rgba(0,0,0,0.05)",
                    }}
                  />
                ) : null;
              })()}
              <div>
                <h3
                  className="font-medium mb-0.5"
                  style={{ color: textColor, fontSize: baseSize.base - 1 }}
                >
                  {strength.title}
                </h3>
                <p
                  className="leading-relaxed opacity-80"
                  style={{ color: textColor, fontSize: baseSize.base - 2 }}
                >
                  {strength.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderSkills = (customConfig?: any) => {
    if (resumeData.skills.length === 0) return null;
    const textColor = customConfig?.textColor || "#3e3e3e";
    return (
      <section key="skills" className={customConfig?.className}>
        <h2
          className={customConfig?.headerClass}
          style={customConfig?.headerStyle}
        >
          Skills
        </h2>
        <div className="flex flex-wrap gap-2">
          {resumeData.skills.map((skill) => (
            <span
              key={skill.id}
              className="px-2 py-1 rounded-md font-medium"
              style={{
                color: textColor,
                backgroundColor: customConfig?.badgeBg || "rgba(0,0,0,0.05)",
                fontSize: baseSize.base - 2,
              }}
            >
              {skill.name}
            </span>
          ))}
        </div>
      </section>
    );
  };

  const renderSocials = (customConfig?: any) => {
    if (resumeData.socials.length === 0) return null;
    const textColor = customConfig?.textColor || "#3e3e3e";
    return (
      <section key="socials" className={customConfig?.className}>
        <h2
          className={customConfig?.headerClass}
          style={customConfig?.headerStyle}
        >
          Find Me Online
        </h2>
        <div
          className={
            customConfig?.rowLayout ? "flex flex-wrap gap-4" : "space-y-2"
          }
        >
          {resumeData.socials.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
            >
              <div
                className="p-1.5 rounded-md"
                style={{
                  color: textColor,
                  backgroundColor: customConfig?.iconBg || "rgba(0,0,0,0.05)",
                }}
              >
                {getSocialIcon(social)}
              </div>
              <div style={{ color: textColor }}>
                <div
                  className="font-medium"
                  style={{ fontSize: baseSize.base - 2 }}
                >
                  {social.platform}
                </div>
                <div
                  className="truncate max-w-[120px] opacity-80"
                  style={{ fontSize: baseSize.base - 3 }}
                >
                  {social.username || "Link"}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    );
  };

  const renderLanguages = (customConfig?: any) => {
    if (resumeData.languages.length === 0) return null;
    const textColor = customConfig?.textColor || "#3e3e3e";
    return (
      <section key="languages" className={customConfig?.className}>
        <h2
          className={customConfig?.headerClass}
          style={customConfig?.headerStyle}
        >
          Languages
        </h2>
        <div className="space-y-2">
          {resumeData.languages.map((lang) => (
            <div
              key={lang.id}
              className="flex items-center justify-between"
              style={{ fontSize: baseSize.base - 2 }}
            >
              <div className="flex flex-col">
                <span
                  className="font-medium"
                  style={{ color: textColor, fontSize: baseSize.base - 1 }}
                >
                  {lang.name}
                </span>
                <span
                  className="opacity-70"
                  style={{ color: textColor, fontSize: baseSize.base - 3 }}
                >
                  {lang.proficiency}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => {
                  const level = lang.proficiency.includes("Native")
                    ? 5
                    : lang.proficiency.includes("Fluent")
                      ? 4
                      : lang.proficiency.includes("Proficient")
                        ? 3
                        : lang.proficiency.includes("Intermediate")
                          ? 2
                          : 1;
                  return (
                    <div
                      key={i}
                      className={`w-1.5 h-4 rounded-sm`}
                      style={{
                        backgroundColor:
                          i <= level ? textColor : "rgba(150,150,150,0.2)",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderCertifications = (customConfig?: any) => {
    if (resumeData.certifications.length === 0) return null;
    const textColor = customConfig?.textColor || "#3e3e3e";
    return (
      <section key="certifications" className={customConfig?.className}>
        <h2
          className={customConfig?.headerClass}
          style={customConfig?.headerStyle}
        >
          Certification
        </h2>
        <div className="space-y-3">
          {resumeData.certifications.map((cert) => (
            <div key={cert.id}>
              <h3
                className="font-medium mb-0.5"
                style={{ color: textColor, fontSize: baseSize.base - 2 }}
              >
                {cert.name}
              </h3>
              <p
                className="opacity-80"
                style={{ color: textColor, fontSize: baseSize.base - 2 }}
              >
                {cert.issuer}
                {cert.link && (
                  <a
                    href={cert.link}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:opacity-100 opacity-80 inline-block ml-1"
                  >
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                )}
              </p>
              {cert.description && (
                <p
                  className="mt-1 leading-relaxed opacity-70"
                  style={{ color: textColor, fontSize: baseSize.base - 3 }}
                >
                  {cert.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderSectionById = (id: string, customConfig?: any) => {
    switch (id) {
      case "summary":
        return renderSummary(customConfig);
      case "experience":
        return renderExperience(customConfig);
      case "education":
        return renderEducation(customConfig);
      case "projects":
        return renderProjects(customConfig);
      case "strengths":
        return renderStrengths(customConfig);
      case "skills":
        return renderSkills(customConfig);
      case "socials":
        return renderSocials(customConfig);
      case "languages":
        return renderLanguages(customConfig);
      case "certifications":
        return renderCertifications(customConfig);
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

      <div className="p-4 border-b flex justify-between items-center bg-card sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 dark:hidden" />
          <Moon className="h-5 w-5 hidden dark:block" />
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPdf(!showPdf)}>
            {showPdf ? "Hide PDF" : "Show PDF"}
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isDownloading}>
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-muted/30">
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
          <div
            ref={contentRef}
            className={`bg-white scale-90 sm:scale-100 origin-top shadow-xl transition-all flex flex-col overflow-hidden`}
            style={{
              fontFamily: settings.fontFamily,
              width,
              minHeight,
              color: "#333",
            }}
          >
            {renderLayout()}
          </div>
        )}
      </div>
    </div>
  );
}
