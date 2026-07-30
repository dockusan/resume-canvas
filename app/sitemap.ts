import { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

/**
 * Only indexable pages belong here. The builder is excluded deliberately: it
 * renders the visitor's own data and is disallowed in robots.txt, so listing
 * it would send crawlers somewhere with nothing to index.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes: {
    path: string;
    priority: number;
    freq: "monthly" | "yearly";
  }[] = [
    { path: "", priority: 1, freq: "monthly" },
    { path: "/templates", priority: 0.9, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "yearly" },
    { path: "/terms", priority: 0.3, freq: "yearly" },
    { path: "/cookies", priority: 0.3, freq: "yearly" },
  ];

  return routes.map(({ path, priority, freq }) => ({
    url: `${SITE.url}${path}`,
    lastModified,
    changeFrequency: freq,
    priority,
  }));
}
