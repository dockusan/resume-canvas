import { darkenColor } from "@/lib/utils";
import { Globe, Mail, MapPin, Phone, User } from "lucide-react";
import Image from "next/image";
import { HtmlLayoutProps } from "../types";

export const ClassicLayout = ({
  resumeData,
  settings,
  photoBorderRadius,
  renderSectionById,
  baseSize,
}: HtmlLayoutProps) => {
  const leftConfig = {
    className: "mb-3",
    headerClass:
      "uppercase tracking-wider mb-2 text-[#3e3e3e] border-b border-[#e5e7eb] font-medium",
    headerStyle: { fontSize: baseSize.title },
    textColor: "#3e3e3e",
    accentColor: settings.themeColor,
  };
  const rightConfig = {
    className: "mb-3",
    headerClass:
      "uppercase tracking-wider mb-3 border-b border-[rgba(255,255,255,0.2)] pb-1 text-[rgba(255,255,255,0.9)] font-medium",
    headerStyle: { fontSize: baseSize.title },
    textColor: "#ffffff",
    iconBg: "rgba(255,255,255,0.2)",
    badgeBg: "rgba(255,255,255,0.2)",
    rowLayout: true,
  };

  return (
    <div className="flex flex-row flex-1">
      {/* Left Column */}
      <div className="w-[65%] p-6 pr-5 flex flex-col gap-4">
        <header style={{ borderColor: settings.themeColor }}>
          <h1
            className="uppercase tracking-wider font-semibold text-[#3e3e3e]"
            style={{ fontSize: baseSize.name }}
          >
            {resumeData.personalInfo.fullName}
          </h1>
          <p
            className="mb-2 font-medium"
            style={{ color: settings.themeColor, fontSize: baseSize.title }}
          >
            {resumeData.personalInfo.title}
          </p>
          <div
            className="flex flex-wrap gap-x-3 gap-y-1 text-[#3e3e3e]"
            style={{ fontSize: baseSize.base - 1.5 }}
          >
            {resumeData.personalInfo.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{resumeData.personalInfo.phone}</span>
              </div>
            )}
            {resumeData.personalInfo.email && (
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>{resumeData.personalInfo.email}</span>
              </div>
            )}
            {resumeData.personalInfo.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{resumeData.personalInfo.location}</span>
              </div>
            )}
            {resumeData.personalInfo.website && (
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>{resumeData.personalInfo.website}</span>
              </div>
            )}
          </div>
        </header>
        {(settings.leftColumn || [])
          .filter((s: any) => s.visible)
          .map((s: any) => renderSectionById(s.id, leftConfig))}
      </div>

      {/* Right Column */}
      <div
        className="w-[35%] text-[#ffffff] p-6 flex flex-col gap-3 relative min-h-full h-full"
        style={{ backgroundColor: settings.themeColor }}
      >
        <div
          className="absolute top-0 left-0 h-4 w-full"
          style={{ background: darkenColor(settings.themeColor, 0.7) }}
        />

        <div className="flex justify-center">
          <div
            className="w-24 h-24 overflow-hidden mt-2 bg-[#e5e7eb] border-3 border-[#ffffff] flex items-center justify-center"
            style={{
              borderRadius: photoBorderRadius,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
          >
            {resumeData.personalInfo.photoUrl ? (
              <Image
                src={resumeData.personalInfo.photoUrl}
                alt={resumeData.personalInfo.fullName}
                className="w-full h-full object-cover"
                width={112}
                height={112}
              />
            ) : (
              <User className="w-24 h-24 text-[#9ca3af]" />
            )}
          </div>
        </div>
        {(settings.rightColumn || [])
          .filter((s: any) => s.visible)
          .map((s: any) => renderSectionById(s.id, rightConfig))}
      </div>
    </div>
  );
};
