import type { Metadata } from "next";

/**
 * One source of truth for site-wide SEO values.
 *
 * Previously each route repeated the whole metadata object, which is how the
 * title ended up duplicated ("Open Source Resume Builder | Free Open Source
 * Resume Builder") and how `metadataBase` drifted to a path instead of an
 * origin — that breaks every relative asset URL Next resolves against it.
 */
export const SITE = {
  name: "Resume Canvas",
  url: "https://resumecanvas.site",
  tagline: "Free, open-source resume builder",
  description:
    "Build a professional, ATS-friendly resume in your browser. Real-time preview, PDF export, six templates and full styling control. No sign-up, no paywall, and your data never leaves your device.",
  repo: "https://github.com/kstmostofa/resume-canvas",
  author: "Md Mostafijur Rahman",
  ogImage: "/og-image.png",
} as const;

interface PageSeo {
  title: string;
  description: string;
  path?: string;
  /** Legal and utility pages carry no search value. */
  noIndex?: boolean;
}

/**
 * Per-page metadata. Titles stay short and distinct — the site name is
 * appended by the root layout's template rather than repeated here.
 */
export function pageMetadata({
  title,
  description,
  path = "",
  noIndex,
}: PageSeo): Metadata {
  const url = `${SITE.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${title} | ${SITE.name}`,
      description,
      url,
      siteName: SITE.name,
      images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name }],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE.name}`,
      description,
      images: [SITE.ogImage],
    },
  };
}

/**
 * Structured data. A resume builder is a SoftwareApplication; saying so gives
 * search engines the price, platform and rating slots to work with rather than
 * leaving them to infer it from prose.
 */
export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web browser)",
    url: SITE.url,
    description: SITE.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: { "@type": "Person", name: SITE.author },
    isAccessibleForFree: true,
    license: "https://opensource.org/licenses/MIT",
    softwareHelp: `${SITE.url}/templates`,
    featureList: [
      "Six resume templates",
      "Live paged preview that matches the PDF exactly",
      "Drag-and-drop section arrangement",
      "Plain-text export for applicant tracking systems",
      "Runs entirely in the browser with no account",
    ],
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}
