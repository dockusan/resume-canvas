import { useEditing } from "@/components/builder/inline/editing-context";
import { PhotoPopover } from "@/components/builder/inline/photo-popover";
import { Globe, Linkedin, Mail, MapPin, Phone, User } from "lucide-react";
import Image from "next/image";
import { PersonalField } from "../../sections/personal-field";
import { HtmlLayoutProps } from "../types";

export const Modern2ColLayout = ({
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
      "uppercase tracking-wider mb-4 font-bold text-[#3e3e3e] flex items-center gap-2",
    headerStyle: {
      borderBottom: `2px solid #e5e7eb`,
      fontSize: baseSize.title,
    },
    textColor: "#4b5563",
    accentColor: settings.themeColor,
    itemClass: "relative pl-4 border-l-2 mb-4",
    hideTimeline: true, // We'll custom style the border
  };
  const rightConfig = {
    className: "mb-3",
    headerClass:
      "uppercase tracking-wider mb-4 font-bold text-[#3e3e3e] flex items-center gap-2",
    headerStyle: {
      borderBottom: `2px solid #e5e7eb`,
      fontSize: baseSize.title,
    },
    textColor: "#4b5563",
    accentColor: settings.themeColor,
    iconBg: `${settings.themeColor}15`,
    badgeBg: `${settings.themeColor}15`,
    rowLayout: true,
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-white">
      {/* Header spans full width */}
      <header
        className="p-8 pb-6 flex flex-col md:flex-row justify-between items-center bg-gray-50 border-b"
        style={{
          borderBottomColor: "#e5e7eb",
          borderBottomWidth: "2px",
        }}
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          {settings.showPhoto !== false &&
            (resumeData.personalInfo.photoUrl || editable) && (
              <PhotoPopover>
                <div className="w-20 h-20 overflow-hidden  shrink-0">
                  {resumeData.personalInfo.photoUrl ? (
                    <Image
                      src={resumeData.personalInfo.photoUrl}
                      alt={resumeData.personalInfo.fullName}
                      className="w-full h-full object-cover bg-transparent"
                      width={80}
                      height={80}
                      style={{ borderRadius: photoBorderRadius }}
                    />
                  ) : (
                    <User
                      className="w-full h-full p-4 opacity-40 bg-gray-100"
                      style={{ borderRadius: photoBorderRadius }}
                    />
                  )}
                </div>
              </PhotoPopover>
            )}
          <div className="text-center md:text-left">
            <h1
              className="font-bold text-[#1f2937] tracking-tight"
              style={{ fontSize: baseSize.name + 8 }}
            >
              <PersonalField name="fullName" />
            </h1>
            <p
              className="font-medium mt-1"
              style={{
                color: settings.themeColor,
                fontSize: baseSize.base + 2,
              }}
            >
              <PersonalField name="title" />
            </p>
          </div>
        </div>
        <div
          className="flex flex-col gap-1.5 font-medium text-gray-500 mt-4 md:mt-0 items-end"
          style={{ fontSize: baseSize.base - 2 }}
        >
          {(editable || resumeData.personalInfo.phone) && (
            <div className="flex items-center gap-1.5">
              <PersonalField name="phone" />{" "}
              <Phone
                className="w-3.5 h-3.5"
                style={{ color: settings.themeColor }}
              />
            </div>
          )}
          {(editable || resumeData.personalInfo.email) && (
            <div className="flex items-center gap-1.5">
              <PersonalField name="email" />{" "}
              <Mail
                className="w-3.5 h-3.5"
                style={{ color: settings.themeColor }}
              />
            </div>
          )}
          {(editable || resumeData.personalInfo.location) && (
            <div className="flex items-center gap-1.5">
              <PersonalField name="location" />{" "}
              <MapPin
                className="w-3.5 h-3.5"
                style={{ color: settings.themeColor }}
              />
            </div>
          )}
          {(editable || resumeData.personalInfo.website) && (
            <div className="flex items-center gap-1.5">
              <PersonalField name="website" />{" "}
              <Globe
                className="w-3.5 h-3.5"
                style={{ color: settings.themeColor }}
              />
            </div>
          )}
          {(editable || resumeData.personalInfo.linkedin) && (
            <div className="flex items-center gap-1.5">
              <PersonalField name="linkedin" />{" "}
              <Linkedin
                className="w-3.5 h-3.5"
                style={{ color: settings.themeColor }}
              />
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-row flex-1">
        {/* Left Column */}
        <div className="w-[65%] p-8 pr-6 flex flex-col">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                            .modern-left .border-l-2 { border-color: ${settings.themeColor}40 !important; }
                        `,
            }}
          />
          <div className="modern-left">
            {(settings.leftColumn || [])
              .filter((s) => s.visible)
              .map((s) => renderSectionById(s, leftConfig))}
          </div>
        </div>

        {/* Right Column */}
        <div className="w-[35%] p-8 pl-6 bg-gray-50/50 border-l border-gray-100 min-h-full">
          {(settings.rightColumn || [])
            .filter((s) => s.visible)
            .map((s) => renderSectionById(s, rightConfig))}
        </div>
      </div>
    </div>
  );
};
