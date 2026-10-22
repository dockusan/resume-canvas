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
    "Fourteen free resume templates, from ATS-friendly single columns to accent sidebars, banners and cards. Restyle any of them completely, then export to PDF.",
  path: "/templates",
});

/** Written per template rather than generated: these describe intent, not structure. */
const NOTES: Record<string, { best: string; detail: string }> = {
  classic: {
    best: "Experienced professionals",
    detail:
      "A filled sidebar carries skills, links and languages while the main column holds your history. Icons and skill tags give it character without crowding the page.",
  },
  sidebar: {
    best: "Engineers and product roles",
    detail:
      "A dark header band over a main column and a light sidebar. Modern and confident, and the sidebar keeps long skill lists from pushing your experience onto page two.",
  },
  clean: {
    best: "Online application portals",
    detail:
      "One column, standard headings, no icons and no photo. The version to upload when an applicant tracking system will read it before a person does.",
  },
  minimal: {
    best: "Academic and traditional fields",
    detail:
      "A centred header, quiet rules and generous whitespace. Nothing competes with the writing, and it survives conservative screening without comment.",
  },
  executive: {
    best: "Senior and leadership roles",
    detail:
      "A single wide column under an accent rule. Restrained, with room for long role descriptions and an optional portrait.",
  },
  compact: {
    best: "Fitting everything on one page",
    detail:
      "Tight margins, side-rule headings and contacts beside your name. The densest layout here, for long histories that must stay on a single page.",
  },
  "accent-panel": {
    best: "Showing a face with your story",
    detail:
      "Your photo sits beside your name at the top of the main column, while a full-height accent panel holds strengths, languages and certifications.",
  },
  banner: {
    best: "Making a strong first impression",
    detail:
      "Name, photo and contacts on an accent banner across the top. Below it a slim sidebar takes the extras and a wide column takes your history.",
  },
  duotone: {
    best: "Creative and design-adjacent roles",
    detail:
      "An accent name card heads a softly tinted sidebar. Two tones of one colour give it personality while the main column stays plain and readable.",
  },
  "soft-sidebar": {
    best: "Client-facing roles",
    detail:
      "A centred portrait and name in a tinted sidebar, with contacts listed underneath. Friendly and approachable without losing structure.",
  },
  centered: {
    best: "Balanced, traditional layouts",
    detail:
      "One column under a centred photo and name, with centred accent titles. Symmetrical and calm, and easy for a reader to scan top to bottom.",
  },
  cards: {
    best: "Modern tech and startup roles",
    detail:
      "Every section sits in its own outlined card. Clear boundaries make a long resume easy to skim, and the single column keeps it parser-friendly.",
  },
  spotlight: {
    best: "Roles where presence matters",
    detail:
      "A large portrait tops the sidebar, and your name sits on an accent card above the main column. The most visual layout here.",
  },
  framed: {
    best: "Structured, formal resumes",
    detail:
      "Your header inside an accent frame, and each section under a solid title bar. Crisp and orderly, with a clear rhythm down the page.",
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
              Fourteen starting points, all free. A template only seeds the
              document — colours, fonts, columns, spacing and every section
              style stay editable afterwards.
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
