import { Footer } from "@/components/footer";
import { TemplateThumbnail } from "@/components/home/sample-resume";
import { JsonLd } from "@/components/json-ld";
import { Button } from "@/components/shared/button";
import {
  TEMPLATE_CATALOG,
  USE_CASES,
  builderHref,
} from "@/lib/schema/template-catalog";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * One page per template: something specific to land on from a search for
 * "executive resume template", with the real render, who it suits, and a
 * one-click start. Built at compile time from the catalog.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return TEMPLATE_CATALOG.map((t) => ({ id: t.id }));
}

const find = (id: string) => TEMPLATE_CATALOG.find((t) => t.id === id);

const clip = (text: string, max: number) =>
  text.length > max
    ? `${text.slice(0, text.lastIndexOf(" ", max - 1))}…`
    : text;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const t = find((await params).id);
  if (!t) return {};
  return pageMetadata({
    title: `${t.name} resume template`,
    description: clip(
      `Free ${t.name} resume template: ${t.columns === 2 ? "two columns" : "one column"}, best for ${t.best.toLowerCase()}. ${t.detail}`,
      155,
    ),
    path: `/templates/${t.id}`,
  });
}

/** Facts true of every template, worth saying on each page. */
const INCLUDED = [
  "Edit on the page itself, with real page breaks",
  "PDF exactly as designed, plus an ATS-safe one-column PDF",
  "Word (.docx) and plain-text exports",
  "Twenty font pairings and eight colour palettes",
  "Saved in your browser — no account",
];

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = find((await params).id);
  if (!t) notFound();

  const uses = USE_CASES.filter((u) => t.uses.includes(u.id));
  const related = TEMPLATE_CATALOG.filter(
    (o) => o.id !== t.id && o.uses.some((u) => t.uses.includes(u)),
  ).slice(0, 3);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "" },
          { name: "Templates", path: "/templates" },
          { name: t.name, path: `/templates/${t.id}` },
        ])}
      />
      <main className="flex min-h-screen flex-col">
        <div className="container mx-auto px-4 py-20 md:px-6 md:py-28">
          <nav
            aria-label="Breadcrumb"
            className="mx-auto max-w-5xl text-sm text-muted-foreground"
          >
            <Link href="/templates" className="hover:text-foreground">
              Templates
            </Link>{" "}
            / <span className="text-foreground">{t.name}</span>
          </nav>

          <div className="mx-auto mt-6 grid max-w-5xl items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-14">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                {t.name} resume template
              </h1>
              <p className="mt-3 font-medium text-primary">
                Best for {t.best.toLowerCase()}
              </p>
              <p className="mt-4 text-lg text-muted-foreground">{t.detail}</p>

              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:max-w-md">
                <div>
                  <dt className="text-muted-foreground">Layout</dt>
                  <dd className="font-medium">
                    {t.columns === 2 ? "Two columns" : "One column"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Photo</dt>
                  <dd className="font-medium">
                    {t.photo ? "Optional" : "No photo"}
                  </dd>
                </div>
              </dl>

              {uses.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground">Suits</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {uses.map((u) => (
                      <li key={u.id}>
                        <Link
                          href={`/templates?use=${u.id}`}
                          className="rounded-full border px-3 py-1 text-sm hover:border-foreground/30"
                        >
                          {u.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button asChild size="lg" className="mt-8 h-12 px-8 text-base">
                <Link href={builderHref(t.id)}>
                  Use {t.name} — free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">
                Opens the builder with this template and a sample to type over.
                Switch templates any time; your words stay.
              </p>

              <h2 className="mt-12 text-lg font-semibold">
                Included with every template
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={builderHref(t.id)}
              aria-label={`Use the ${t.name} template`}
              className="group block rounded-xl bg-muted/40 p-6"
            >
              <TemplateThumbnail
                presetId={t.id}
                photo={t.photo}
                className="rounded-sm shadow-xl transition-transform duration-300 group-hover:-translate-y-1"
              />
              <p className="mt-3 text-center text-xs text-muted-foreground">
                The sample resume in {t.name}, drawn by the builder itself
              </p>
            </Link>
          </div>

          {related.length > 0 && (
            <section className="mx-auto mt-20 max-w-5xl">
              <h2 className="text-lg font-semibold">Similar templates</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-3">
                {related.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/templates/${o.id}`}
                      className="block h-full rounded-xl border bg-card p-4 hover:border-foreground/30"
                    >
                      <span className="font-medium">{o.name}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Best for {o.best.toLowerCase()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
