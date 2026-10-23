import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { TemplateGallery } from "@/components/templates/template-gallery";
import { Button } from "@/components/shared/button";
import { TEMPLATE_CATALOG } from "@/lib/schema/template-catalog";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata = pageMetadata({
  title: "Resume templates",
  description:
    "Fourteen free resume templates, from ATS-friendly single columns to accent sidebars, banners and cards. Restyle any of them completely, then export to PDF.",
  path: "/templates",
});

export default function TemplatesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "" },
          { name: "Templates", path: "/templates" },
        ])}
      />
      <main className="flex min-h-screen flex-col">
        <div className="container mx-auto px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Resume templates
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Fourteen starting points, all free, shown with the same sample
              resume so you can compare them. Filter by what you need, then open
              one — colours, fonts, columns and spacing stay editable, and
              switching later keeps everything you&rsquo;ve written.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/builder">
                Open the builder
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <TemplateGallery templates={TEMPLATE_CATALOG} />

          <div className="mx-auto mt-16 max-w-2xl rounded-xl border bg-muted/30 p-6 text-center">
            <h2 className="text-lg font-semibold">
              Not sure which one to pick?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with Classic — the builder opens with it — and change it
              later. Switching templates keeps everything you have written; it
              only replaces the styling, so nothing is lost by trying another.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/builder">Start writing</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
