import { Image, Text, View } from "@react-pdf/renderer";
import { PdfIcon } from "../../pdf-components/pdf-icon";
import { PdfLayoutProps } from "../types";

export const CreativeLayout = ({
  resumeData,
  settings,
  photoBorderRadius,
  renderSectionById,
  baseSize,
}: PdfLayoutProps) => {
  const leftConfig = {
    containerStyle: { marginBottom: 10 },
    headerStyle: {
      fontSize: baseSize.base + 1,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
      color: "#ffffff",
      backgroundColor: settings.themeColor,
      padding: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      fontWeight: 700,
      alignSelf: "flex-start",
    },
    textColor: "#4b5563",
    accentColor: settings.themeColor,
    hideTimeline: false,
  };
  const rightConfig = {
    containerStyle: { marginBottom: 10 },
    headerStyle: {
      fontSize: baseSize.base + 1,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
      color: "#3e3e3e",
      backgroundColor: "#ffffff",
      padding: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      fontWeight: 700,
      alignSelf: "flex-start",
    },
    textColor: "#4b5563",
    accentColor: settings.themeColor,
    iconBg: "rgba(0,0,0,0.05)",
    badgeBg: "rgba(0,0,0,0.05)",
    rowLayout: true,
  };
  return (
    <View style={{ flexDirection: "row", flex: 1, backgroundColor: "#ffffff" }}>
      <View style={{ width: "35%", backgroundColor: "#f3f4f6", padding: 16 }}>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          {resumeData.personalInfo.photoUrl && (
            <Image
              src={resumeData.personalInfo.photoUrl}
              style={{
                width: 80,
                height: 80,
                borderRadius: photoBorderRadius,
                objectFit: "cover",
                marginBottom: 8,
              }}
            />
          )}
          <Text
            style={{
              fontSize: baseSize.name - 5,
              fontWeight: 600,
              color: "#111827",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            {resumeData.personalInfo.fullName}
          </Text>
          <Text
            style={{
              fontSize: baseSize.base + 1,
              color: settings.themeColor,
              fontWeight: 600,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {resumeData.personalInfo.title}
          </Text>

          <View
            style={{
              padding: 10,
              backgroundColor: "rgba(255,255,255,0.7)",
              borderRadius: 8,
              width: "100%",
              gap: 6,
            }}
          >
            {resumeData.personalInfo.phone && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <PdfIcon name="Phone" size={10} color={settings.themeColor} />
                <Text style={{ fontSize: baseSize.base - 2, color: "#4b5563" }}>
                  {resumeData.personalInfo.phone}
                </Text>
              </View>
            )}
            {resumeData.personalInfo.email && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <PdfIcon name="Mail" size={10} color={settings.themeColor} />
                <Text style={{ fontSize: baseSize.base - 2, color: "#4b5563" }}>
                  {resumeData.personalInfo.email}
                </Text>
              </View>
            )}
            {resumeData.personalInfo.location && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <PdfIcon name="MapPin" size={10} color={settings.themeColor} />
                <Text style={{ fontSize: baseSize.base - 2, color: "#4b5563" }}>
                  {resumeData.personalInfo.location}
                </Text>
              </View>
            )}
            {resumeData.personalInfo.website && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <PdfIcon name="Globe" size={10} color={settings.themeColor} />
                <Text style={{ fontSize: baseSize.base - 2, color: "#4b5563" }}>
                  {resumeData.personalInfo.website}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View>
          {(settings.rightColumn || [])
            .filter((s: any) => s.visible)
            .map((s: any) => renderSectionById(s.id, rightConfig))}
        </View>
      </View>
      <View style={{ width: "65%", padding: 16 }}>
        {(settings.leftColumn || [])
          .filter((s: any) => s.visible)
          .map((s: any) => renderSectionById(s.id, leftConfig))}
      </View>
    </View>
  );
};
