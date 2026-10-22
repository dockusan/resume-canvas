import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { Fragment } from "react/jsx-runtime";

export const metadata: Metadata = pageMetadata({
  title: "Resume builder",
  description:
    "Write, style and export your resume in the browser. Live paged preview, fourteen templates, an ATS checker with job-description matching, and PDF, ATS-safe PDF and Word export.",
  path: "/builder",
  // The builder renders the visitor's own data; there is nothing to index.
  noIndex: true,
});

export default function BuilderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Fragment>{children}</Fragment>;
}
