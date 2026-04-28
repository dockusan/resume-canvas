import Image from "next/image";
import { HtmlLayoutProps } from "../types";

export const MinimalLayout = ({
  resumeData,
  settings,
  photoBorderRadius,
  renderSectionById,
  baseSize,
}: HtmlLayoutProps) => {
  const config = {
    className: "mb-3",
    headerClass:
      "uppercase tracking-widest mb-2 text-[#3e3e3e] border-b border-[#e5e7eb] pb-1 font-bold",
    headerStyle: { fontSize: baseSize.base + 1 },
    textColor: "#000000",
    accentColor: "#333333",
    hideTimeline: true,
    iconBg: "rgba(0,0,0,0.05)",
    badgeBg: "rgba(0,0,0,0.05)",
    rowLayout: true,
  };

  const allSections = [
    ...(settings.leftColumn || []),
    ...(settings.rightColumn || []),
  ];

  return (
    <div
      className="flex flex-col flex-1 p-8 md:p-10"
      style={{ color: "black", backgroundColor: "white" }}
    >
      <header className="mb-6 flex flex-col md:flex-row items-center justify-between border-b pb-6">
        <div className="text-center md:text-left flex-1">
          <h1
            className="tracking-tight font-black mb-1"
            style={{ fontSize: baseSize.name + 4 }}
          >
            {resumeData.personalInfo.fullName}
          </h1>
          <p
            className="font-medium opacity-80 mb-2"
            style={{ fontSize: baseSize.base + 1 }}
          >
            {resumeData.personalInfo.title}
          </p>
          <div
            className="flex flex-wrap md:justify-start justify-center gap-x-4 gap-y-1 opacity-70"
            style={{ fontSize: baseSize.base - 2 }}
          >
            {resumeData.personalInfo.phone && (
              <span>{resumeData.personalInfo.phone}</span>
            )}
            {resumeData.personalInfo.email && (
              <span>{resumeData.personalInfo.email}</span>
            )}
            {resumeData.personalInfo.location && (
              <span>{resumeData.personalInfo.location}</span>
            )}
            {resumeData.personalInfo.website && (
              <span>{resumeData.personalInfo.website}</span>
            )}
            {resumeData.personalInfo.linkedin && (
              <span>{resumeData.personalInfo.linkedin}</span>
            )}
          </div>
        </div>
        {resumeData.personalInfo.photoUrl && (
          <div
            className="w-20 h-20 shrink-0 mt-4 md:mt-0 ml-0 md:ml-6 overflow-hidden"
            style={{ borderRadius: photoBorderRadius }}
          >
            <Image
              src={resumeData.personalInfo.photoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
              width={80}
              height={80}
            />
          </div>
        )}
      </header>

      <div className="max-w-3xl mx-auto w-full">
        {allSections
          .filter((s: any) => s.visible)
          .map((s: any) => renderSectionById(s.id, config))}
      </div>
    </div>
  );
};
