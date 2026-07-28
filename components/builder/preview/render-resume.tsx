import {
  customSectionUuid,
  isCustomSectionId,
} from "@/lib/store/useResumeStore";
import {
  applyPdfOverride,
  resolvePathOverride,
} from "@/lib/style-overrides";
import { ResumeData, ResumeSettings, SectionConfig } from "@/lib/types";
import { Document, Font, Link, Page, Text, View } from "@react-pdf/renderer";
import { ClassicLayout as ClassicPdfLayout } from "./layouts/pdf/ClassicLayout";
import { CreativeLayout as CreativePdfLayout } from "./layouts/pdf/CreativeLayout";
import { ExecutiveLayout as ExecutivePdfLayout } from "./layouts/pdf/ExecutiveLayout";
import { MinimalLayout as MinimalPdfLayout } from "./layouts/pdf/MinimalLayout";
import { Modern1ColLayout as Modern1ColPdfLayout } from "./layouts/pdf/Modern1ColLayout";
import { Modern2ColLayout as Modern2ColPdfLayout } from "./layouts/pdf/Modern2ColLayout";
import { PdfIcon } from "./pdf-components/pdf-icon";

// Register fonts if not already registered
if (!Font.getRegisteredFontFamilies().includes("Khand")) {
  Font.register({
    family: "Khand",
    fonts: [
      { src: "/fonts/Khand-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/Khand-Medium.ttf", fontWeight: 500 },
      { src: "/fonts/Khand-SemiBold.ttf", fontWeight: 600 },
      { src: "/fonts/Khand-Bold.ttf", fontWeight: 700 },
    ],
  });
}
if (!Font.getRegisteredFontFamilies().includes("Inter")) {
  Font.register({
    family: "Inter",
    fonts: [
      { src: "/fonts/Inter.ttf", fontWeight: 400 },
      { src: "/fonts/Inter-Medium.ttf", fontWeight: 500 },
      { src: "/fonts/Inter-SemiBold.ttf", fontWeight: 600 },
      { src: "/fonts/Inter-Bold.ttf", fontWeight: 700 },
    ],
  });
}

const getBulletIcon = (style: string) => {
  switch (style) {
    case "Circle":
      return <PdfIcon name="Circle" size={4} color="#656565" />;
    case "Square":
      return <PdfIcon name="Square" size={5} color="#656565" fill="#656565" />;
    case "Check":
      return <PdfIcon name="Check" size={12} color="#656565" fill="#656565" />;
    case "ArrowRight":
      return <PdfIcon name="ArrowRight" size={8} color="#656565" />;
    case "ChevronRight":
      return <PdfIcon name="ChevronRight" size={12} color="#656565" />;
    case "Diamond":
      return <PdfIcon name="Diamond" size={6} color="#656565" fill="#656565" />;
    case "Star":
      return <PdfIcon name="Star" size={6} color="#656565" fill="#656565" />;
    case "Minus":
      return <PdfIcon name="Minus" size={12} color="#656565" fill="#656565" />;
    case "default":
    default:
      return <PdfIcon name="Dot" size={8} color="#656565" fill="#656565" />;
  }
};

export const RenderResume = ({
  resumeData,
  settings,
}: {
  resumeData: ResumeData;
  settings: ResumeSettings;
}) => {
  const isLetter = settings.documentSize === "Letter";

  const getPdfFont = (fontFamily: string) => {
    if (!fontFamily) return "Inter";
    const family = fontFamily.toLowerCase();
    if (family.includes("khand")) return "Khand";
    if (family.includes("inter")) return "Inter";
    return "Helvetica";
  };
  const fontFamily = getPdfFont(settings.fontFamily);

  const getPhotoBorderRadius = () => {
    switch (settings.photoStyle) {
      case "square":
        return 0;
      case "rounded":
        return 8;
      case "circle":
      default:
        return 999;
    }
  };
  const photoBorderRadius = getPhotoBorderRadius();

  const getBaseStyles = (fontSize: "sm" | "md" | "lg" | "xl") => {
    switch (fontSize) {
      case "sm":
        return { base: 8, title: 10, name: 20 };
      case "lg":
        return { base: 12, title: 14, name: 28 };
      case "xl":
        return { base: 14, title: 16, name: 28 };
      case "md":
      default:
        return { base: 10, title: 12, name: 24 };
    }
  };
  const baseSize = getBaseStyles(settings.fontSize || "md");

  // Apply user style overrides (section → item → field cascade) to a style.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ov = (style: any, path: string): any =>
    applyPdfOverride(style, resolvePathOverride(settings.styleOverrides, path));

  const renderSectionById = (section: SectionConfig, config: any = {}) => {
    const textColor = config.textColor || "#3e3e3e";
    const accentColor = config.accentColor || settings.themeColor;
    const baseHeaderStyle = config.headerStyle || {
      fontSize: baseSize.title,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4,
      color: "#3e3e3e",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      paddingBottom: 4,
      fontWeight: 500,
    };
    const itemStyle = config.itemStyle || { marginBottom: 8 };
    const headerStyle = ov(baseHeaderStyle, `${section.id}.heading`);

    if (isCustomSectionId(section.id)) {
      const custom = (resumeData.customSections || []).find(
        (c) => c.id === customSectionUuid(section.id),
      );
      const items = (custom?.items ?? []).filter(
        (item) => item.title || item.subtitle || item.date || item.description,
      );
      // Empty custom sections never print.
      if (!items.length) return null;
      return (
        <View
          style={config.containerStyle || { marginBottom: 12 }}
          key={section.id}
        >
          <Text style={headerStyle}>{section.name}</Text>
          {items.map((item) => (
            <View key={item.id} style={itemStyle}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    flex: 1,
                  }}
                >
                  {item.icon && (
                    <View
                      style={{
                        backgroundColor: config.iconBg || "rgba(0,0,0,0.05)",
                        padding: 4,
                        borderRadius: 4,
                      }}
                    >
                      <PdfIcon name={item.icon} size={8} color={textColor} />
                    </View>
                  )}
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.title,
                        color: textColor,
                        fontWeight: 500,
                      },
                      `${section.id}.${item.id}.title`,
                    )}
                  >
                    {item.title}
                  </Text>
                </View>
                {item.date ? (
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base - 2,
                        color: textColor,
                        fontWeight: 500,
                      },
                      `${section.id}.${item.id}.date`,
                    )}
                  >
                    {item.date}
                  </Text>
                ) : null}
              </View>
              {item.subtitle ? (
                <Text
                  style={ov(
                    {
                      fontSize: baseSize.base - 2,
                      color: accentColor,
                      fontWeight: 500,
                    },
                    `${section.id}.${item.id}.subtitle`,
                  )}
                >
                  {item.subtitle}
                </Text>
              ) : null}
              {item.link ? (
                <Link src={item.link} style={{ textDecoration: "none" }}>
                  <Text
                    style={{
                      fontSize: baseSize.base - 2,
                      color: accentColor,
                      marginBottom: 2,
                      fontWeight: 500,
                    }}
                  >
                    {item.link}
                  </Text>
                </Link>
              ) : null}
              {item.description &&
                (item.bulletStyle === "none" || !item.bulletStyle ? (
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base - 2,
                        color: textColor,
                        lineHeight: 1.5,
                      },
                      `${section.id}.${item.id}.description`,
                    )}
                  >
                    {item.description}
                  </Text>
                ) : (
                  item.description
                    .split("\n")
                    .filter((i) => i.trim().length > 0)
                    .map((line, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 2,
                        }}
                      >
                        <View style={{ marginRight: 6 }}>
                          {getBulletIcon(item.bulletStyle || "Dot")}
                        </View>
                        <Text
                          style={ov(
                            {
                              flex: 1,
                              fontSize: baseSize.base - 2,
                              color: textColor,
                            },
                            `${section.id}.${item.id}.description`,
                          )}
                        >
                          {line.replace(/^[•\-\*•◦▪]\s*/, "")}
                        </Text>
                      </View>
                    ))
                ))}
            </View>
          ))}
        </View>
      );
    }

    switch (section.id) {
      case "summary":
        if (!resumeData.personalInfo.summary) return null;
        return (
          <View
            style={config.containerStyle || { marginBottom: 12 }}
            key="summary"
          >
            <Text style={headerStyle}>{section.name}</Text>
            <Text
              style={ov(
                {
                  fontSize: baseSize.base,
                  color: textColor,
                  lineHeight: 1.5,
                  textAlign: "justify",
                },
                "summary.text",
              )}
            >
              {resumeData.personalInfo.summary}
            </Text>
          </View>
        );
      case "experience":
        if (!resumeData.experience.length) return null;
        return (
          <View
            style={config.containerStyle || { marginBottom: 12 }}
            key="experience"
          >
            <Text style={headerStyle}>{section.name}</Text>
            {resumeData.experience.map((exp: any) => (
              <View key={exp.id} style={itemStyle}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                  }}
                >
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base,
                        color: textColor,
                        fontWeight: 500,
                      },
                      `experience.${exp.id}.title`,
                    )}
                  >
                    {exp.title}
                  </Text>
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base - 2,
                        color: textColor,
                        fontWeight: 500,
                      },
                      `experience.${exp.id}.date`,
                    )}
                  >
                    {exp.startDate} / {exp.current ? "Present" : exp.endDate}
                  </Text>
                </View>
                <Text
                  style={ov(
                    {
                      fontSize: baseSize.base - 2,
                      color: accentColor,
                      fontWeight: 500,
                    },
                    `experience.${exp.id}.company`,
                  )}
                >
                  {exp.company} • {exp.location}
                </Text>
                {exp.description &&
                  exp.bulletStyle !== "none" &&
                  exp.description
                    .split("\n")
                    .filter((i: any) => i.trim().length > 0)
                    .map((item: any, index: any) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 2,
                        }}
                      >
                        <View style={{ marginRight: 6 }}>
                          {getBulletIcon(exp.bulletStyle || "Dot")}
                        </View>
                        <Text
                          style={ov(
                            {
                              flex: 1,
                              fontSize: baseSize.base - 2,
                              color: textColor,
                            },
                            `experience.${exp.id}.description`,
                          )}
                        >
                          {item.replace(/^[•\-\*•◦▪]\s*/, "")}
                        </Text>
                      </View>
                    ))}
              </View>
            ))}
          </View>
        );
      case "education":
        if (!resumeData.education.length) return null;
        return (
          <View
            style={config.containerStyle || { marginBottom: 12 }}
            key="education"
          >
            <Text style={headerStyle}>{section.name}</Text>
            {resumeData.education.map((edu: any) => (
              <View key={edu.id} style={itemStyle}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                  }}
                >
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base,
                        color: textColor,
                        fontWeight: 500,
                      },
                      `education.${edu.id}.degree`,
                    )}
                  >
                    {edu.degree}
                  </Text>
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base - 3,
                        color: textColor,
                        fontWeight: 500,
                      },
                      `education.${edu.id}.date`,
                    )}
                  >
                    {edu.startDate} / {edu.current ? "Present" : edu.endDate}
                  </Text>
                </View>
                <Text
                  style={ov(
                    {
                      fontSize: baseSize.base - 2,
                      color: accentColor,
                      fontWeight: 500,
                    },
                    `education.${edu.id}.school`,
                  )}
                >
                  {edu.school}, {edu.location}
                </Text>
              </View>
            ))}
          </View>
        );
      case "projects":
        if (!resumeData.projects.length) return null;
        return (
          <View
            style={config.containerStyle || { marginBottom: 12 }}
            key="projects"
          >
            <Text style={headerStyle}>{section.name}</Text>
            {resumeData.projects.map((project: any) => (
              <View key={project.id} style={itemStyle}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                  }}
                >
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.title,
                        color: textColor,
                        fontWeight: 500,
                      },
                      `projects.${project.id}.name`,
                    )}
                  >
                    {project.name}
                  </Text>
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base - 2,
                        color: textColor,
                        fontWeight: 500,
                      },
                      `projects.${project.id}.date`,
                    )}
                  >
                    {project.date}
                  </Text>
                </View>
                {project.link && (
                  <Link src={project.link} style={{ textDecoration: "none" }}>
                    <Text
                      style={{
                        fontSize: baseSize.base - 2,
                        color: accentColor,
                        marginBottom: 2,
                        fontWeight: 500,
                      }}
                    >
                      {project.link}
                    </Text>
                  </Link>
                )}
                <Text
                  style={ov(
                    {
                      fontSize: baseSize.base - 2,
                      color: textColor,
                      lineHeight: 1.5,
                      textAlign: "justify",
                    },
                    `projects.${project.id}.description`,
                  )}
                >
                  {project.description}
                </Text>
              </View>
            ))}
          </View>
        );
      case "strengths":
        if (!resumeData.strengths.length) return null;
        return (
          <View
            style={config.containerStyle || { marginBottom: 12 }}
            key="strengths"
          >
            <Text style={headerStyle}>{section.name}</Text>
            {resumeData.strengths.map((str: any) => (
              <View
                key={str.id}
                style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}
              >
                {str.icon && (
                  <View
                    style={{
                      backgroundColor: config.iconBg || "rgba(0,0,0,0.05)",
                      padding: 6,
                      borderRadius: 6,
                      width: 20,
                      height: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PdfIcon name={str.icon} size={8} color={textColor} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base - 2,
                        color: textColor,
                        fontWeight: 600,
                        marginBottom: 2,
                      },
                      `strengths.${str.id}.title`,
                    )}
                  >
                    {str.title}
                  </Text>
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base - 1,
                        color: textColor,
                        opacity: 0.8,
                        lineHeight: 1.2,
                      },
                      `strengths.${str.id}.description`,
                    )}
                  >
                    {str.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        );
      case "skills":
        if (!resumeData.skills.length) return null;
        return (
          <View
            style={config.containerStyle || { marginBottom: 12 }}
            key="skills"
          >
            <Text style={headerStyle}>{section.name}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {resumeData.skills.map((skill: any) => (
                <Text
                  key={skill.id}
                  style={ov(
                    {
                      backgroundColor: config.badgeBg || "rgba(0,0,0,0.05)",
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                      borderRadius: 4,
                      fontSize: baseSize.base - 1,
                      color: textColor,
                      fontWeight: 500,
                    },
                    `skills.${skill.id}.name`,
                  )}
                >
                  {skill.name}
                </Text>
              ))}
            </View>
          </View>
        );
      case "languages":
        if (!resumeData.languages.length) return null;
        return (
          <View
            style={config.containerStyle || { marginBottom: 12 }}
            key="languages"
          >
            <Text style={headerStyle}>{section.name}</Text>
            {resumeData.languages.map((lang: any) => (
              <View
                key={lang.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <View>
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base - 2,
                        color: textColor,
                        fontWeight: 500,
                      },
                      `languages.${lang.id}.name`,
                    )}
                  >
                    {lang.name}
                  </Text>
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base - 1,
                        color: textColor,
                        opacity: 0.7,
                      },
                      `languages.${lang.id}.proficiency`,
                    )}
                  >
                    {lang.proficiency}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const level = lang.proficiency.includes("Native")
                      ? 5
                      : lang.proficiency.includes("Fluent")
                        ? 4
                        : lang.proficiency.includes("Proficient")
                          ? 3
                          : lang.proficiency.includes("Intermediate")
                            ? 2
                            : 1;
                    return (
                      <View
                        key={i}
                        style={{
                          width: 4,
                          height: 10,
                          borderRadius: 2,
                          backgroundColor:
                            i <= level ? textColor : "rgba(150,150,150,0.2)",
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        );
      case "socials":
        if (!resumeData.socials.length) return null;
        return (
          <View
            style={config.containerStyle || { marginBottom: 12 }}
            key="socials"
          >
            <Text style={headerStyle}>{section.name}</Text>
            <View
              style={{
                flexDirection: config.rowLayout ? "row" : "column",
                flexWrap: config.rowLayout ? "wrap" : "nowrap",
                gap: config.rowLayout ? 12 : 0,
              }}
            >
              {resumeData.socials.map((social: any) => (
                <Link
                  key={social.id}
                  src={social.url}
                  style={{ textDecoration: "none" }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: config.iconBg || "rgba(0,0,0,0.05)",
                        padding: 4,
                        borderRadius: 4,
                      }}
                    >
                      <PdfIcon
                        name={social.icon || social.platform}
                        size={10}
                        color={textColor}
                      />
                    </View>
                    <View>
                      <Text
                        style={ov(
                          {
                            fontSize: baseSize.base - 2,
                            color: textColor,
                            fontWeight: 500,
                            lineHeight: 1.2,
                          },
                          `socials.${social.id}.platform`,
                        )}
                      >
                        {social.platform}
                      </Text>
                      <Text
                        style={ov(
                          {
                            fontSize: baseSize.base - 3,
                            color: textColor,
                            opacity: 0.8,
                          },
                          `socials.${social.id}.username`,
                        )}
                      >
                        {social.username || "Link"}
                      </Text>
                    </View>
                  </View>
                </Link>
              ))}
            </View>
          </View>
        );
      case "certifications":
        if (!resumeData.certifications.length) return null;
        return (
          <View
            style={config.containerStyle || { marginBottom: 12 }}
            key="certifications"
          >
            <Text style={headerStyle}>{section.name}</Text>
            {resumeData.certifications.map((cert: any) => (
              <View key={cert.id} style={{ marginBottom: 6 }}>
                <Text
                  style={ov(
                    {
                      fontSize: baseSize.base - 2,
                      color: textColor,
                      fontWeight: 500,
                    },
                    `certifications.${cert.id}.name`,
                  )}
                >
                  {cert.name}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Text
                    style={ov(
                      {
                        fontSize: baseSize.base - 2,
                        color: textColor,
                        opacity: 0.8,
                      },
                      `certifications.${cert.id}.issuer`,
                    )}
                  >
                    {cert.issuer}
                  </Text>
                  <Link src={cert.link} style={{ textDecoration: "none" }}>
                    <PdfIcon name="ExternalLink" size={8} color={accentColor} />
                  </Link>
                </View>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  const renderSelectedLayout = () => {
    const layoutProps = {
      resumeData,
      settings,
      photoBorderRadius,
      baseSize,
      renderSectionById,
    };

    switch (settings.template) {
      case "minimal":
        return <MinimalPdfLayout {...layoutProps} />;
      case "modern":
        return <Modern1ColPdfLayout {...layoutProps} />;
      case "modern-2col":
        return <Modern2ColPdfLayout {...layoutProps} />;
      case "executive":
        return <ExecutivePdfLayout {...layoutProps} />;
      case "creative":
        return <CreativePdfLayout {...layoutProps} />;
      case "classic":
      default:
        return <ClassicPdfLayout {...layoutProps} />;
    }
  };

  return (
    <Document author="Resume Canvas" producer="Resume Canvas">
      <Page
        size={isLetter ? "LETTER" : "A4"}
        style={{ flexDirection: "row", backgroundColor: "#ffffff", fontFamily }}
      >
        {renderSelectedLayout()}
      </Page>
    </Document>
  );
};
