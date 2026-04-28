import { Image, Text, View } from "@react-pdf/renderer";
import { PdfIcon } from "../../pdf-components/pdf-icon";
import { PdfLayoutProps } from "../types";

export const Modern2ColLayout = ({
  resumeData,
  settings,
  photoBorderRadius,
  renderSectionById,
  baseSize,
}: PdfLayoutProps) => {
  const leftConfig = {
    containerStyle: { marginBottom: 10 },
    headerStyle: {
      fontSize: baseSize.title,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
      color: "#3e3e3e",
      borderBottomWidth: 1.5,
      borderBottomColor: "#e5e7eb",
      paddingBottom: 2,
      fontWeight: 700,
    },
    textColor: "#3e3e3e",
    accentColor: settings.themeColor,
  };
  const rightConfig = {
    containerStyle: { marginBottom: 10 },
    headerStyle: {
      fontSize: baseSize.title,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
      color: "#3e3e3e",
      borderBottomWidth: 1.5,
      borderBottomColor: "#e5e7eb",
      paddingBottom: 2,
      fontWeight: 700,
    },
    textColor: "#3e3e3e",
    accentColor: settings.themeColor,
    iconBg: "rgba(0,0,0,0.05)",
    badgeBg: "rgba(0,0,0,0.05)",
    rowLayout: true,
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View
        style={{
          flexDirection: "row",
          padding: 24,
          backgroundColor: "#f9fafb",
          borderBottomWidth: 2,
          borderBottomColor: "#e5e7eb",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          {resumeData.personalInfo.photoUrl && (
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
          <View>
            <Text
              style={{
                fontSize: baseSize.name + 8,
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: 2,
              }}
            >
              {resumeData.personalInfo.fullName}
            </Text>
            <Text
              style={{
                fontSize: baseSize.base + 2,
                color: settings.themeColor,
                fontWeight: 600,
              }}
            >
              {resumeData.personalInfo.title}
            </Text>
          </View>
        </View>
        <View
          style={{
            alignItems: "flex-end",
            gap: 3,
            fontSize: baseSize.base - 2,
            color: "#6b7280",
          }}
        >
          {resumeData.personalInfo.phone && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text>{resumeData.personalInfo.phone}</Text>
              <PdfIcon name="Phone" size={9} color={settings.themeColor} />
            </View>
          )}
          {resumeData.personalInfo.email && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text>{resumeData.personalInfo.email}</Text>
              <PdfIcon name="Mail" size={9} color={settings.themeColor} />
            </View>
          )}
          {resumeData.personalInfo.location && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text>{resumeData.personalInfo.location}</Text>
              <PdfIcon name="MapPin" size={9} color={settings.themeColor} />
            </View>
          )}
          {resumeData.personalInfo.website && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text>{resumeData.personalInfo.website}</Text>
              <PdfIcon name="Globe" size={9} color={settings.themeColor} />
            </View>
          )}
        </View>
      </View>
      <View style={{ flexDirection: "row", flex: 1 }}>
        <View style={{ width: "65%", padding: 24, paddingRight: 16 }}>
          {(settings.leftColumn || [])
            .filter((s: any) => s.visible)
            .map((s: any) => renderSectionById(s.id, leftConfig))}
        </View>
        <View
          style={{
            width: "35%",
            padding: 24,
            paddingLeft: 16,
            backgroundColor: "#f9fafb",
            borderLeftWidth: 1,
            borderLeftColor: "#f3f4f6",
          }}
        >
          {(settings.rightColumn || [])
            .filter((s: any) => s.visible)
            .map((s: any) => renderSectionById(s.id, rightConfig))}
        </View>
      </View>
    </View>
  );
};
