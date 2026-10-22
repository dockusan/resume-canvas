"use client";

import { LivePreview } from "@/components/home/live-preview";
import { Button } from "@/components/shared/button";
import { SITE } from "@/lib/seo";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

/** Claims a visitor can verify in a minute, not marketing adjectives. */
const PROOF = [
  "No sign-up",
  "Saved in your browser",
  "PDF matches the preview",
  "MIT licensed",
];

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

/**
 * One job: get a visitor into the builder. There is a single filled button;
 * everything else (templates, GitHub) is a quiet text link, so the next step
 * is never in question. Beside it, the real renderer shows what they'll get.
 */
export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-24"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <motion.p {...rise(0)} className="text-sm font-medium text-primary">
              Free and open source
            </motion.p>

            <motion.h1
              {...rise(0.08)}
              className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl xl:text-6xl"
            >
              The resume builder that{" "}
              <span className="text-primary">
                keeps your resume on your device
              </span>
            </motion.h1>

            <motion.p
              {...rise(0.16)}
              className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl lg:mx-0"
            >
              Edit right on the page with real page breaks, then download a PDF
              that matches it exactly — or an ATS-safe PDF, a Word file or plain
              text. No account, no paywall.
            </motion.p>

            <motion.div
              {...rise(0.24)}
              className="mt-9 flex flex-col items-center gap-3 lg:items-start"
            >
              <Button
                size="lg"
                asChild
                className="h-14 px-9 text-lg font-semibold shadow-lg shadow-primary/25"
              >
                <Link href="/builder">
                  Build my resume
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Opens with a sample resume you can type over.{" "}
                <Link
                  href="/templates"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Or browse all 14 templates
                </Link>
              </p>
            </motion.div>

            <motion.ul
              {...rise(0.32)}
              className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start"
            >
              {PROOF.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" />
                  {item === "MIT licensed" ? (
                    <Link
                      href={SITE.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {item}
                    </Link>
                  ) : (
                    item
                  )}
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none"
          >
            <LivePreview />
            <div className="pointer-events-none absolute inset-x-8 -bottom-6 -z-10 h-12 rounded-full bg-primary/20 blur-2xl" />
          </motion.div>
        </div>
      </div>

      <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-[600px] w-[600px] -translate-x-1/3 translate-y-1/4 rounded-full bg-secondary/20 blur-3xl" />
    </section>
  );
}
