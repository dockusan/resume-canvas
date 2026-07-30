import { MetadataRoute } from "next";
import { SITE, UPDATED } from "@/lib/seo";

/**
 * Only indexable pages belong here. The builder is excluded deliberately: it
 * renders the visitor's own data and carries `noindex`, so listing it would
 * send crawlers somewhere with nothing to index. Shared resumes (`/r/…`) are
 * excluded for a stronger reason — they are other people's personal details.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: {
    path: string;
    priority: number;
    freq: "monthly" | "yearly";
    lastModified: string;
  }[] = [
    { path: "", priority: 1, freq: "monthly", lastModified: UPDATED.home },
    {
      path: "/templates",
      priority: 0.9,
      freq: "monthly",
      lastModified: UPDATED.templates,
    },
    {
      path: "/privacy",
      priority: 0.3,
      freq: "yearly",
      lastModified: UPDATED.privacy,
    },
    {
      path: "/terms",
      priority: 0.3,
      freq: "yearly",
      lastModified: UPDATED.terms,
    },
    {
      path: "/cookies",
      priority: 0.3,
      freq: "yearly",
      lastModified: UPDATED.cookies,
    },
  ];

  return routes.map(({ path, priority, freq, lastModified }) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date(`${lastModified}T00:00:00Z`),
    changeFrequency: freq,
    priority,
  }));
}
