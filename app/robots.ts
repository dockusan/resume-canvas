import { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The builder is a single-page app whose content is user data; there is
      // nothing there for a crawler to index. `/r/` is stronger than that:
      // those are real people's resumes, and no one's should ever be
      // reachable from a search result.
      disallow: ["/builder", "/r/", "/api/"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
