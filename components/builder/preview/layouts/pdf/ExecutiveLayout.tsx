import { applyPdfOverride, resolvePathOverride } from "@/lib/style-overrides";
import { Image, Text, View } from "@react-pdf/renderer";
import { PdfLayoutProps } from "../types";

export const ExecutiveLayout = ({
  resumeData,
  settings,
  photoBorderRadius,
  renderSectionById,
  baseSize,
}: PdfLayoutProps) => {
  const config = {
    containerStyle: { marginBottom: 10 },
    headerStyle: {
      fontSize: baseSize.base + 1,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
      color: "#374151",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      paddingBottom: 2,
      fontWeight: 700,
    },
    textColor: "#374151",
    accentColor: settings.themeColor,
    itemClass: "mb-2",
    hideTimeline: true,
    iconBg: "rgba(0,0,0,0.04)",
    badgeBg: "rgba(0,0,0,0.04)",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pov = (style: any, path: string): any =>
    applyPdfOverride(style, resolvePathOverride(settings.styleOverrides, path));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        padding: 24,
        borderTopWidth: 8,
        borderTopColor: settings.themeColor,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: 16,
          marginBottom: 10,
          alignItems: "center",
        }}
      >
        {settings.showPhoto !== false && resumeData.personalInfo.photoUrl && (
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: photoBorderRadius,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <Image
              src={resumeData.personalInfo.photoUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={pov(
              {
                fontSize: baseSize.name,
                fontWeight: 700,
                color: "#111827",
              },
              "personalInfo.fullName",
            )}
          >
            {resumeData.personalInfo.fullName}
          </Text>
          <Text
            style={pov(
              {
                fontSize: baseSize.base + 2,
                color: settings.themeColor,
                fontWeight: 600,
                marginBottom: 6,
              },
              "personalInfo.title",
            )}
          >
            {resumeData.personalInfo.title}
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              fontSize: baseSize.base - 2,
              color: "#6b7280",
            }}
          >
            {resumeData.personalInfo.phone && (
              <Text style={pov({}, "personalInfo.phone")}>
                {resumeData.personalInfo.phone}
              </Text>
            )}
            {resumeData.personalInfo.email && (
              <Text style={pov({}, "personalInfo.email")}>
                | {resumeData.personalInfo.email}
              </Text>
            )}
            {resumeData.personalInfo.location && (
              <Text style={pov({}, "personalInfo.location")}>
                | {resumeData.personalInfo.location}
              </Text>
            )}
            {resumeData.personalInfo.linkedin && (
              <Text style={pov({}, "personalInfo.linkedin")}>
                | {resumeData.personalInfo.linkedin}
              </Text>
            )}
          </View>
        </View>
      </View>
      <View style={{ width: "100%" }}>
        {[...(settings.leftColumn || []), ...(settings.rightColumn || [])]
          .filter((s: any) => s.visible)
          .map((s: any) => renderSectionById(s, config))}
      </View>
    </View>
  );
};
