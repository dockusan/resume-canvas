import Image from "next/image";
import { HtmlLayoutProps } from "../types";

export const ExecutiveLayout = ({
  resumeData,
  settings,
  photoBorderRadius,
  renderSectionById,
  baseSize,
}: HtmlLayoutProps) => {
  const config = {
    className: "mb-3",
    headerClass:
      "uppercase tracking-wider mb-2 font-bold text-[#374151] border-b border-[#e5e7eb] pb-1",
    headerStyle: { fontSize: baseSize.base + 1 },
    textColor: "#374151",
    accentColor: settings.themeColor,
    itemClass: "mb-2",
    hideTimeline: true,
    iconBg: "rgba(0,0,0,0.04)",
    badgeBg: "rgba(0,0,0,0.04)",
    rowLayout: true,
  };

  const allSections = [
    ...(settings.leftColumn || []),
    ...(settings.rightColumn || []),
  ];

  return (
    <div
      className="flex flex-col flex-1 p-8 bg-white"
      style={{ borderTop: `8px solid ${settings.themeColor}` }}
    >
      <header className="mb-6 flex space-x-6 items-center">
        {resumeData.personalInfo.photoUrl && (
          <div
            className="w-24 h-24 shrink-0 overflow-hidden shadow-sm"
            style={{
              borderRadius: photoBorderRadius,
              border: "1px solid #e5e7eb",
            }}
          >
            <Image
              src={resumeData.personalInfo.photoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
              width={96}
              height={96}
            />
          </div>
        )}
        <div className="flex-1">
          <h1
            className="font-extrabold text-[#111827] leading-tight"
            style={{ fontSize: baseSize.name + 12 }}
          >
            {resumeData.personalInfo.fullName}
          </h1>
          <p
            className="font-bold mt-1"
            style={{ color: settings.themeColor, fontSize: baseSize.base + 2 }}
          >
            {resumeData.personalInfo.title}
          </p>
          <div
            className="flex flex-wrap gap-x-3 gap-y-1 font-medium text-gray-500 mt-2"
            style={{ fontSize: baseSize.base - 2 }}
          >
            {resumeData.personalInfo.phone && (
              <span>{resumeData.personalInfo.phone}</span>
            )}
            {resumeData.personalInfo.email && (
              <span className="border-l border-gray-300 pl-3">
                {resumeData.personalInfo.email}
              </span>
            )}
            {resumeData.personalInfo.location && (
              <span className="border-l border-gray-300 pl-3">
                {resumeData.personalInfo.location}
              </span>
            )}
            {resumeData.personalInfo.linkedin && (
              <span className="border-l border-gray-300 pl-3">
                {resumeData.personalInfo.linkedin}
              </span>
            )}
          </div>
        </div>
      </header>
      <div className="w-full">
        {allSections
          .filter((s: any) => s.visible)
          .map((s: any) => renderSectionById(s.id, config))}
      </div>
    </div>
  );
};
