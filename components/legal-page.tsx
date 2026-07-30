import { Footer } from "@/components/footer";

/**
 * Shared shell for the policy pages: one place for the reading measure,
 * heading rhythm and last-updated line.
 */
export function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex min-h-screen flex-col">
        <div className="container mx-auto px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-muted-foreground">{intro}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated {updated}
            </p>
            <div className="mt-10 space-y-8 text-sm leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:mt-2 [&_p]:text-muted-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
