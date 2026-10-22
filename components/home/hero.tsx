"use client";

import { Button } from "@/components/shared/button";
import { SITE } from "@/lib/seo";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/** Claims a visitor can verify in a minute, not marketing adjectives. */
const PROOF = [
  "No sign-up",
  "Runs in your browser",
  "PDF matches the preview",
  "MIT licensed",
];

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...rise(0)}>
            <Link
              href={SITE.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
            >
              <Github className="h-3.5 w-3.5" />
              Open source — star it on GitHub
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          <motion.h1
            {...rise(0.08)}
            className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            The resume builder that{" "}
            <span className="text-primary">never sees your resume</span>
          </motion.h1>

          <motion.p
            {...rise(0.16)}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Write, style and export a professional resume entirely in your
            browser. Fourteen templates, live page breaks, and a PDF that
            matches what you see exactly — with no account and nothing uploaded.
          </motion.p>

          <motion.div
            {...rise(0.24)}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" asChild className="h-12 px-8 text-base">
              <Link href="/builder">
                Start building — it&rsquo;s free
                <ArrowUpRight className="ml-1.5 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 px-8 text-base"
            >
              <Link href="/templates">Browse templates</Link>
            </Button>
          </motion.div>

          <motion.ul
            {...rise(0.32)}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
          >
            {PROOF.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* The product itself, rather than the placeholder that used to sit
            here. Both themes are shipped so the shot matches the page. */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="relative mx-auto mt-16 max-w-6xl"
        >
          <div className="overflow-hidden rounded-xl border bg-card shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-xs text-muted-foreground">
                resumecanvas.site/builder
              </span>
            </div>
            <Image
              src="/preview-light.png"
              alt="The Resume Canvas builder showing a two-column resume with the section panel open"
              width={3200}
              height={2000}
              priority
              sizes="(max-width: 1024px) 100vw, 1152px"
              className="w-full dark:hidden"
            />
            <Image
              src="/preview-dark.png"
              alt=""
              aria-hidden
              width={3200}
              height={2000}
              sizes="(max-width: 1024px) 100vw, 1152px"
              className="hidden w-full dark:block"
            />
          </div>
          <div className="pointer-events-none absolute inset-x-8 -bottom-6 h-12 rounded-full bg-primary/20 blur-2xl" />
        </motion.div>
      </div>

      <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-[600px] w-[600px] -translate-x-1/3 translate-y-1/4 rounded-full bg-secondary/20 blur-3xl" />
    </section>
  );
}
