import { Button } from "@/components/shared/button";
import Link from "next/link";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        We couldn&rsquo;t find that page
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The link may be out of date. Your resume is safe — it is stored in your
        browser, not on this page.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/builder">Open the builder</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/templates">Browse templates</Link>
        </Button>
      </div>
    </main>
  );
}
