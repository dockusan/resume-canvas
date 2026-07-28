import { applyPdfOverride, resolvePathOverride } from "@/lib/style-overrides";
import { Image, Text, View } from "@react-pdf/renderer";
import { PdfIcon } from "../../pdf-components/pdf-icon";
import { PdfLayoutProps } from "../types";

export const Modern1ColLayout = ({
  resumeData,
  settings,
  photoBorderRadius,
  renderSectionById,
  baseSize,
}: PdfLayoutProps) => {
  const config = {
    containerStyle: { marginBottom: 10 },
    headerStyle: {
      fontSize: baseSize.title,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
      color: settings.themeColor,
      paddingBottom: 2,
      fontWeight: 600,
      borderBottomWidth: 1.5,
      borderBottomColor: settings.themeColor,
    },
    textColor: "#3e3e3e",
    accentColor: settings.themeColor,
    hideTimeline: true,
    iconBg: "rgba(0,0,0,0.05)",
    badgeBg: "rgba(0,0,0,0.05)",
    rowLayout: true,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pov = (style: any, path: string): any =>
    applyPdfOverride(style, resolvePathOverride(settings.styleOverrides, path));

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View
        style={{
          backgroundColor: settings.themeColor,
          padding: 24,
          flexDirection: "row",
          alignItems: "center",
          color: "#ffffff",
          gap: 20,
        }}
      >
        {settings.showPhoto !== false && resumeData.personalInfo.photoUrl && (
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: photoBorderRadius,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.5)",
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
                fontSize: baseSize.name + 8,
                fontWeight: 700,
                color: "#ffffff",
                marginBottom: 2,
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
                color: "rgba(255,255,255,0.9)",
                fontWeight: 500,
                marginBottom: 8,
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
              gap: 12,
              fontSize: baseSize.base - 2,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {resumeData.personalInfo.phone && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <PdfIcon name="Phone" size={10} color="#fff" />
                <Text style={pov({}, "personalInfo.phone")}>
                  {resumeData.personalInfo.phone}
                </Text>
              </View>
            )}
            {resumeData.personalInfo.email && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <PdfIcon name="Mail" size={10} color="#fff" />
                <Text style={pov({}, "personalInfo.email")}>
                  {resumeData.personalInfo.email}
                </Text>
              </View>
            )}
            {resumeData.personalInfo.website && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <PdfIcon name="Globe" size={10} color="#fff" />
                <Text style={pov({}, "personalInfo.website")}>
                  {resumeData.personalInfo.website}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={{ padding: 24 }}>
        {[...(settings.leftColumn || []), ...(settings.rightColumn || [])]
          .filter((s: any) => s.visible)
          .map((s: any) => renderSectionById(s, config))}
      </View>
    </View>
  );
};
