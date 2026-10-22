#!/usr/bin/env node
/**
 * Link check for the public site.
 *
 * Crawls every page reachable from the home page (and every page in the
 * sitemap) on a running server, and fails if an internal link returns
 * anything but 200 or points at an #anchor the target page doesn't have.
 * With --external it also requests every outbound link once.
 *
 *   pnpm build && pnpm start &
 *   BASE_URL=http://localhost:3000 pnpm check:links [--external]
 */

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const EXTERNAL = process.argv.includes("--external");
/** Pages rendered from the visitor's own data, or not pages at all. */
const SKIP_CRAWL = [/^\/builder/, /^\/r\//, /^\/api\//];
/** Sites that refuse unauthenticated requests but are reachable in a browser. */
const BOT_WALLS = { "www.linkedin.com": [999], "linkedin.com": [999] };

const pages = new Map(); // path -> { status, html }
const failures = [];

async function fetchPage(path) {
  if (!pages.has(path)) {
    pages.set(
      path,
      fetch(BASE + path, { redirect: "follow" }).then(async (res) => ({
        status: res.status,
        html: res.headers.get("content-type")?.includes("text/html")
          ? await res.text()
          : "",
      })),
    );
  }
  return pages.get(path);
}

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"');

function hrefsIn(html) {
  return [...html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)].map((m) =>
    decode(m[1]),
  );
}

const hasAnchor = (html, id) =>
  new RegExp(`\\sid="${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(html);

async function sitemapPaths() {
  const res = await fetch(`${BASE}/sitemap.xml`);
  if (!res.ok) {
    failures.push(`/sitemap.xml returned ${res.status}`);
    return [];
  }
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => new URL(m[1]).pathname,
  );
}

async function main() {
  const queue = ["/", ...(await sitemapPaths())];
  const seen = new Set();
  const external = new Map(); // url -> first page linking to it

  while (queue.length) {
    const path = queue.shift();
    if (seen.has(path)) continue;
    seen.add(path);

    const page = await fetchPage(path);
    if (page.status !== 200) {
      failures.push(`${path} returned ${page.status}`);
      continue;
    }
    if (SKIP_CRAWL.some((re) => re.test(path))) continue;

    for (const href of hrefsIn(page.html)) {
      if (/^(mailto|tel|javascript):/i.test(href) || href === "") continue;
      const url = new URL(href, BASE + path);
      if (url.origin !== BASE) {
        if (!external.has(url.href)) external.set(url.href, path);
        continue;
      }
      const target = url.pathname;
      const linked = await fetchPage(target);
      if (linked.status !== 200) {
        failures.push(`${path} → ${href}: ${target} returned ${linked.status}`);
        continue;
      }
      const id = decodeURIComponent(url.hash.slice(1));
      if (id && !hasAnchor(linked.html, id)) {
        failures.push(`${path} → ${href}: no element with id="${id}"`);
      }
      if (!seen.has(target)) queue.push(target);
    }
  }

  if (EXTERNAL) {
    for (const [href, from] of external) {
      try {
        const res = await fetch(href, {
          redirect: "follow",
          headers: { "user-agent": "Mozilla/5.0 (link check)" },
          signal: AbortSignal.timeout(15_000),
        });
        const allowed = BOT_WALLS[new URL(href).hostname] ?? [];
        if (!res.ok && !allowed.includes(res.status)) {
          failures.push(`${from} → ${href} returned ${res.status}`);
        }
      } catch (error) {
        failures.push(`${from} → ${href} failed: ${error.message}`);
      }
    }
  }

  console.log(
    `Checked ${seen.size} pages` +
      (EXTERNAL ? ` and ${external.size} external links` : "") +
      ` on ${BASE}.`,
  );
  if (failures.length) {
    console.error(`\n${failures.length} broken:\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
  console.log("No broken links.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
