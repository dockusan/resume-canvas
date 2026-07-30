import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { TemplatePreview } from "@/components/builder/inspector/previews";
import { Button } from "@/components/shared/button";
import { DEFAULT_THEME } from "@/lib/schema/defaults";
import { PRESET_IDS, buildPreset } from "@/lib/schema/presets";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata = pageMetadata({
  title: "Resume templates",
  description:
    "Six free resume templates — classic two-column, minimal, modern, executive and creative. Every one is a starting point you can restyle completely, and all export to PDF.",
  path: "/templates",
});

/** Written per template rather than generated: these describe intent, not structure. */
const NOTES: Record<string, { best: string; detail: string }> = {
  classic: {
    best: "Experienced professionals",
    detail:
      "A filled sidebar holds skills and contact details while the main column carries your history. The strongest choice when you have more experience than fits comfortably in one column.",
  },
  minimal: {
    best: "Academic and traditional fields",
    detail:
      "One column, generous whitespace, no colour. Nothing competes with the writing, and it survives conservative screening processes without comment.",
  },
  modern: {
    best: "Most applications",
    detail:
      "A coloured header band over a single column. Enough personality to look considered, plain enough underneath to stay readable in bulk.",
  },
  "modern-2col": {
    best: "Dense technical resumes",
    detail:
      "A full-width header above two columns, so long skill lists sit beside your history rather than pushing it onto a second page.",
  },
  executive: {
    best: "Senior and leadership roles",
    detail:
      "A single wide column under a thin accent rule. Restrained, and it gives long role descriptions the width they need.",
  },
  creative: {
    best: "Design and marketing",
    detail:
      "A tinted sidebar with pill headings and a timeline down the main column. The most visually distinct of the six.",
  },
};

export default function TemplatesPage() {
  const presets = PRESET_IDS.map((id) =>
    buildPreset(id, DEFAULT_THEME.colors.accent),
  );

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
              Six starting points, all free. A template only seeds the document
              — colours, fonts, columns, spacing and every section style stay
              editable afterwards.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/builder">
                Open the builder
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((preset) => {
              const note = NOTES[preset.id];
              return (
                <article
                  key={preset.id}
                  className="flex flex-col rounded-xl border bg-card p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="scale-[2.2] origin-top-left">
                      <TemplatePreview preset={preset} />
                    </div>
                    <div className="ml-16 min-w-0">
                      <h2 className="text-base font-semibold">{preset.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {preset.layout.columns === 2
                          ? "Two columns"
                          : "One column"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-14 text-xs font-medium text-primary">
                    Best for {note?.best.toLowerCase()}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {note?.detail}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mx-auto mt-16 max-w-2xl rounded-xl border bg-muted/30 p-6 text-center">
            <h2 className="text-lg font-semibold">
              Not sure which one to pick?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with Modern and change it later. Switching templates keeps
              everything you have written — it only replaces the styling — so
              nothing is lost by trying another.
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
