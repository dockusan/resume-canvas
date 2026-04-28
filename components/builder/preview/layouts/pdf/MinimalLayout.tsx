import { Image, Text, View } from "@react-pdf/renderer";
import { PdfLayoutProps } from "../types";

export const MinimalLayout = ({
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
      letterSpacing: 1.5,
      marginBottom: 6,
      color: "#3e3e3e",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      paddingBottom: 2,
      fontWeight: 700,
    },
    textColor: "#000000",
    accentColor: "#333333",
    hideTimeline: true,
    iconBg: "rgba(0,0,0,0.05)",
    badgeBg: "rgba(0,0,0,0.05)",
    rowLayout: true,
  };

  return (
    <View style={{ flex: 1, padding: 30, backgroundColor: "#ffffff" }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
          paddingBottom: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: baseSize.name + 4,
              fontWeight: 700,
              color: "#000000",
            }}
          >
            {resumeData.personalInfo.fullName}
          </Text>
          <Text
            style={{
              fontSize: baseSize.base + 1,
              color: "#333333",
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            {resumeData.personalInfo.title}
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              fontSize: baseSize.base - 2,
              color: "#555555",
            }}
          >
            {resumeData.personalInfo.phone && (
              <Text>{resumeData.personalInfo.phone}</Text>
            )}
            {resumeData.personalInfo.email && (
              <Text>{resumeData.personalInfo.email}</Text>
            )}
            {resumeData.personalInfo.location && (
              <Text>{resumeData.personalInfo.location}</Text>
            )}
            {resumeData.personalInfo.website && (
              <Text>{resumeData.personalInfo.website}</Text>
            )}
            {resumeData.personalInfo.linkedin && (
              <Text>{resumeData.personalInfo.linkedin}</Text>
            )}
          </View>
        </View>
        {resumeData.personalInfo.photoUrl && (
          <Image
            src={resumeData.personalInfo.photoUrl}
            style={{
              width: 64,
              height: 64,
              borderRadius: photoBorderRadius,
              objectFit: "cover",
            }}
          />
        )}
      </View>
      <View style={{ paddingHorizontal: 10 }}>
        {[...(settings.leftColumn || []), ...(settings.rightColumn || [])]
          .filter((s: any) => s.visible)
          .map((s: any) => renderSectionById(s.id, config))}
      </View>
    </View>
  );
};
