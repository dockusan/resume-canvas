import { useEditing } from "@/components/builder/inline/editing-context";
import { PhotoPopover } from "@/components/builder/inline/photo-popover";
import { Globe, Mail, MapPin, Phone, User } from "lucide-react";
import Image from "next/image";
import { PersonalField } from "../../sections/personal-field";
import { HtmlLayoutProps } from "../types";

export const CreativeLayout = ({
  resumeData,
  settings,
  photoBorderRadius,
  renderSectionById,
  baseSize,
}: HtmlLayoutProps) => {
  const { editable } = useEditing();
  const leftConfig = {
    className: "mb-3",
    headerClass:
      "uppercase tracking-wider mb-3 font-bold inline-block px-3 py-1 text-white shadow-sm",
    headerStyle: {
      backgroundColor: settings.themeColor,
      borderRadius: "4px",
      fontSize: baseSize.base + 1,
    },
    textColor: "#4b5563",
    accentColor: settings.themeColor,
    itemClass: "relative pl-5 border-l-2 mb-4",
    hideTimeline: false,
  };
  const rightConfig = {
    className: "mb-3",
    headerClass:
      "uppercase tracking-wider mb-3 font-bold inline-block px-3 py-1 text-[#3e3e3e] bg-white rounded shadow-sm",
    headerStyle: {
      fontSize: baseSize.base + 1,
    },
    textColor: "#4b5563",
    accentColor: settings.themeColor,
    iconBg: "rgba(0,0,0,0.05)",
    badgeBg: "rgba(0,0,0,0.05)",
    rowLayout: true,
  };

  return (
    <div className="flex flex-row flex-1 bg-[#ffffff]">
      <div className="w-[35%] bg-gray-100 p-6 flex flex-col relative overflow-hidden text-[#3e3e3e]">
        <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-transparent to-black/10" />
        <div className="mb-4 relative z-10">
          {settings.showPhoto !== false &&
            (resumeData.personalInfo.photoUrl || editable) && (
              <div className="w-24 h-24 mx-auto mb-3">
                <PhotoPopover>
                  <div
                    className="w-24 h-24 overflow-hidden border-4 border-white shadow-xl rotate-[-2deg]"
                    style={{ borderRadius: photoBorderRadius }}
                  >
                    {resumeData.personalInfo.photoUrl ? (
                      <Image
                        src={resumeData.personalInfo.photoUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        width={128}
                        height={128}
                      />
                    ) : (
                      <User className="w-full h-full p-5 opacity-40 bg-white" />
                    )}
                  </div>
                </PhotoPopover>
              </div>
            )}
          <h1
            className="font-bold text-center leading-tight mb-2 text-[#111827]"
            style={{ fontSize: baseSize.name - 5 }}
          >
            <PersonalField name="fullName" />
          </h1>
          <p
            className="text-center font-medium mb-4"
            style={{ color: settings.themeColor, fontSize: baseSize.base + 1 }}
          >
            <PersonalField name="title" />
          </p>

          <div
            className="flex flex-col gap-2 text-gray-600 bg-white/60 p-3 rounded-lg border border-white"
            style={{ fontSize: baseSize.base - 2 }}
          >
            {(editable || resumeData.personalInfo.phone) && (
              <div className="flex items-center gap-2">
                <Phone
                  className="w-3.5 h-3.5"
                  style={{ color: settings.themeColor }}
                />
                <PersonalField name="phone" />
              </div>
            )}
            {(editable || resumeData.personalInfo.email) && (
              <div className="flex items-center gap-2">
                <Mail
                  className="w-3.5 h-3.5"
                  style={{ color: settings.themeColor }}
                />
                <PersonalField name="email" />
              </div>
            )}
            {(editable || resumeData.personalInfo.location) && (
              <div className="flex items-center gap-2">
                <MapPin
                  className="w-3.5 h-3.5"
                  style={{ color: settings.themeColor }}
                />
                <PersonalField name="location" />
              </div>
            )}
            {(editable || resumeData.personalInfo.website) && (
              <div className="flex items-center gap-2">
                <Globe
                  className="w-3.5 h-3.5"
                  style={{ color: settings.themeColor }}
                />
                <PersonalField name="website" />
              </div>
            )}
          </div>
        </div>
        <div className="relative z-10">
          {(settings.rightColumn || [])
            .filter((s) => s.visible)
            .map((s) => renderSectionById(s, rightConfig))}
        </div>
      </div>

      <div className="w-[65%] p-6 pl-8 flex flex-col">
        <style
          dangerouslySetInnerHTML={{
            __html: `
                        .creative-left .border-l-2 { border-color: ${settings.themeColor}30 !important; }
                        .creative-left .rounded-full.bg-\[\#d1d5db\] { background-color: ${settings.themeColor} !important; left: -6px; top: 5px; width: 10px; height: 10px;}
                    `,
          }}
        />
        <div className="creative-left">
          {(settings.leftColumn || [])
            .filter((s) => s.visible)
            .map((s) => renderSectionById(s, leftConfig))}
        </div>
      </div>
    </div>
  );
};
