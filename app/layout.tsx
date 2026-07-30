import ThemeProvider from "@/providers/theme-provider";
import { SITE } from "@/lib/seo";
import type { Metadata, Viewport } from "next";
import { Khand } from "next/font/google";
import "./globals.css";

const khand = Khand({
  variable: "--font-khand",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  // A template keeps the site name out of every page title, so titles stay
  // short and distinct instead of repeating themselves.
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.author, url: SITE.repo }],
  creator: SITE.author,
  publisher: SITE.name,
  category: "productivity",
  alternates: { canonical: SITE.url },
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    images: [
      {
        url: SITE.ogImage,
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [SITE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * Tints the browser chrome on mobile so the status bar does not sit as a white
 * band above the page.
 *
 * A single value rather than a `prefers-color-scheme` pair: the theme is
 * applied as a class with `defaultTheme="dark"`, so a first visit renders dark
 * whatever the operating system prefers, and keying the colour off the media
 * query would disagree with the page on every light-mode device. `#0a0a0a` is
 * the resolved value of `--background` in the dark scheme.
 */
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${khand.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
