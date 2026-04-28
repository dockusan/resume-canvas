import { Globe, Mail, Phone } from "lucide-react";
import Image from "next/image";
import { HtmlLayoutProps } from "../types";

export const Modern1ColLayout = ({
  resumeData,
  settings,
  photoBorderRadius,
  renderSectionById,
  baseSize,
}: HtmlLayoutProps) => {
  const config = {
    className: "mb-3",
    headerClass:
      "uppercase tracking-wider mb-4 font-semibold inline-block pb-1",
    headerStyle: {
      color: settings.themeColor,
      borderBottom: `2px solid ${settings.themeColor}`,
      fontSize: baseSize.title,
    },
    textColor: "#3e3e3e",
    accentColor: settings.themeColor,
    hideTimeline: true,
    iconBg: `${settings.themeColor}15`,
    badgeBg: `${settings.themeColor}15`,
    rowLayout: true,
  };

  const allSections = [
    ...(settings.leftColumn || []),
    ...(settings.rightColumn || []),
  ];

  return (
    <div className="flex flex-col flex-1 pt-0">
      <header
        className="px-8 py-6 text-white flex flex-col md:flex-row items-center gap-6"
        style={{ backgroundColor: settings.themeColor }}
      >
        {resumeData.personalInfo.photoUrl && (
          <div
            className="w-20 h-20 shrink-0 border-2 border-white/50 overflow-hidden shadow-lg"
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
        <div className="text-center md:text-left flex-1">
          <h1
            className="font-bold mb-0.5 tracking-wide leading-none"
            style={{ fontSize: baseSize.name + 8 }}
          >
            {resumeData.personalInfo.fullName}
          </h1>
          <p
            className="opacity-90 font-medium mb-3"
            style={{ fontSize: baseSize.base + 2 }}
          >
            {resumeData.personalInfo.title}
          </p>
          <div
            className="flex flex-wrap md:justify-start justify-center gap-x-4 gap-y-2 opacity-80"
            style={{ fontSize: baseSize.base - 2 }}
          >
            {resumeData.personalInfo.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {resumeData.personalInfo.phone}
              </div>
            )}
            {resumeData.personalInfo.email && (
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {resumeData.personalInfo.email}
              </div>
            )}
            {resumeData.personalInfo.website && (
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {resumeData.personalInfo.website}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="p-8">
        {allSections
          .filter((s: any) => s.visible)
          .map((s: any) => renderSectionById(s.id, config))}
      </div>
    </div>
  );
};
