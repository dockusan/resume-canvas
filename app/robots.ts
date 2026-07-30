import { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // `/builder` is deliberately NOT disallowed. It carries `noindex`, and a
      // crawler forbidden from fetching a page can never read that — it would
      // stay eligible for a bare-URL listing, which is exactly what the
      // noindex is there to prevent. The home page links to it, so it will be
      // found; letting it be crawled is what keeps it out of the index.
      //
      // `/r/` is the opposite case: those are real people's resumes, they are
      // never linked from the site, and the ids are unguessable. Blocking the
      // fetch outright is the point, and the `noindex, nofollow` on the page
      // still catches any crawler that ignores this file.
      disallow: ["/r/", "/api/"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
