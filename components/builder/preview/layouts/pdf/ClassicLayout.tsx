import { applyPdfOverride, resolvePathOverride } from "@/lib/style-overrides";
import { darkenColor } from "@/lib/utils";
import { Image, Text, View } from "@react-pdf/renderer";
import { PdfIcon } from "../../pdf-components/pdf-icon";
import { PdfLayoutProps } from "../types";

export const ClassicLayout = ({
  resumeData,
  settings,
  photoBorderRadius,
  renderSectionById,
  baseSize,
}: PdfLayoutProps) => {
  const leftConfig = {
    containerStyle: { marginBottom: 8 },
    headerStyle: {
      fontSize: baseSize.title,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
      color: "#3e3e3e",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      paddingBottom: 2,
      fontWeight: 500,
    },
    textColor: "#3e3e3e",
    accentColor: settings.themeColor,
  };
  const rightConfig = {
    containerStyle: { marginBottom: 8 },
    headerStyle: {
      fontSize: baseSize.title,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
      color: "rgba(255,255,255,0.9)",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
      paddingBottom: 2,
      fontWeight: 500,
    },
    textColor: "#ffffff",
    iconBg: "rgba(255,255,255,0.2)",
    badgeBg: "rgba(255,255,255,0.2)",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pov = (style: any, path: string): any =>
    applyPdfOverride(style, resolvePathOverride(settings.styleOverrides, path));

  return (
    <View style={{ flexDirection: "row", flex: 1, backgroundColor: "#ffffff" }}>
      <View style={{ width: "65%", padding: 24 }}>
        <View
          style={{
            marginBottom: 12,
            borderLeftWidth: 0,
            borderLeftColor: settings.themeColor,
          }}
        >
          <Text
            style={pov(
              {
                fontSize: baseSize.name,
                textTransform: "uppercase",
                color: "#3e3e3e",
                fontWeight: 500,
                letterSpacing: 0,
              },
              "personalInfo.fullName",
            )}
          >
            {resumeData.personalInfo.fullName}
          </Text>
          <Text
            style={pov(
              {
                fontSize: baseSize.title,
                color: settings.themeColor,
                fontWeight: 500,
                marginBottom: 4,
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
              columnGap: 8,
              fontSize: baseSize.base - 1.5,
              color: "#3e3e3e",
            }}
          >
            {resumeData.personalInfo.phone && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <PdfIcon name="Phone" size={8} color="#3e3e3e" />
                <Text style={pov({}, "personalInfo.phone")}>
                  {resumeData.personalInfo.phone}
                </Text>
              </View>
            )}
            {resumeData.personalInfo.email && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <PdfIcon name="Mail" size={8} color="#3e3e3e" />
                <Text style={pov({}, "personalInfo.email")}>
                  {resumeData.personalInfo.email}
                </Text>
              </View>
            )}
            {resumeData.personalInfo.location && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <PdfIcon name="MapPin" size={8} color="#3e3e3e" />
                <Text style={pov({}, "personalInfo.location")}>
                  {resumeData.personalInfo.location}
                </Text>
              </View>
            )}
            {resumeData.personalInfo.website && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
              >
                <PdfIcon name="Globe" size={8} color="#3e3e3e" />
                <Text style={pov({}, "personalInfo.website")}>
                  {resumeData.personalInfo.website}
                </Text>
              </View>
            )}
          </View>
        </View>
        {(settings.leftColumn || [])
          .filter((s: any) => s.visible)
          .map((s: any) => renderSectionById(s, leftConfig))}
      </View>

      <View
        style={{
          width: "35%",
          backgroundColor: settings.themeColor,
          padding: 20,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 10,
            backgroundColor: darkenColor(settings.themeColor, 0.7),
          }}
        />
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          {settings.showPhoto !== false && resumeData.personalInfo.photoUrl && (
            <Image
              src={resumeData.personalInfo.photoUrl}
              style={{
                width: 80,
                height: 80,
                borderRadius: photoBorderRadius,
                objectFit: "cover",
              }}
            />
          )}
        </View>
        {(settings.rightColumn || [])
          .filter((s: any) => s.visible)
          .map((s: any) => renderSectionById(s, rightConfig))}
      </View>
    </View>
  );
};
