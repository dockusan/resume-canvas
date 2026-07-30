"use client";

import { JsonLd } from "@/components/json-ld";
import { SITE, faqJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import { useId, useState } from "react";

/**
 * Replaces the testimonial section.
 *
 * Those quotes were invented and attributed to people who do not exist, which
 * is not something a real product should ship. Answering the questions people
 * actually have before trying a resume builder is more persuasive anyway — and
 * unlike fake praise, it can be marked up as FAQ structured data.
 */
export const FAQS = [
  {
    question: "Is Resume Canvas really free?",
    answer:
      "Yes. Every template, every styling control and both export formats are free, with no account and no paywall. The source is MIT licensed, so you can also read it or run it yourself.",
  },
  {
    question: "Where is my resume stored?",
    answer:
      "In your own browser. Nothing is uploaded as you write, there is no sign-up and no analytics. The one exception is if you create a share link, and even then the resume is encrypted on your device first — see the next question. The trade-off is that your work lives on one device and one browser, so export a PDF when you have something worth keeping.",
  },
  {
    question: "Can I share my resume with a link?",
    answer:
      "Yes. Creating a link encrypts your resume in your browser and uploads only the encrypted file; the key to decrypt it is placed after the # in the link, which browsers never send to a server. So we store something we cannot read, and anyone you give the full link to can view and download the resume. You choose how long the link lasts — after that the file is deleted automatically.",
  },
  {
    question: "Will the PDF look exactly like the preview?",
    answer:
      "Yes. The preview renders real page boxes and the PDF is produced by printing those same pages with your browser's own engine, so there is no second renderer that could disagree with what you see.",
  },
  {
    question: "Is the output ATS-friendly?",
    answer:
      "The PDF keeps real, selectable text rather than an image. Applicant tracking systems still read multi-column layouts unevenly, so there is also a one-click plain-text export that flattens everything to a single column for pasting into application forms.",
  },
  {
    question: "Can I change a template after I start?",
    answer:
      "Yes, and you keep everything you have written — switching only replaces the styling. You can also change columns, colours, fonts, spacing, section order and per-field visibility without touching a template at all.",
  },
  {
    question: "How many pages can my resume be?",
    answer:
      "As many as you need. The builder shows real page breaks as you type, tells you the page count, and lets you force a section onto a new page or keep it from splitting.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. It runs in any modern browser on desktop, tablet or phone. There is a form-based Content mode designed for editing on a small screen.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq" className="scroll-mt-24 py-20 sm:py-28">
      <JsonLd data={faqJsonLd(FAQS)} />
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          {/* A sticky rail keeps the heading and the escape hatch in view
              while a long list of answers scrolls past it. */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-medium text-primary">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Common questions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything worth knowing before you start writing.
            </p>
            <a
              href={`${SITE.repo}/issues`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Still stuck? Ask on GitHub
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const expanded = open === index;
              const panelId = `${baseId}-panel-${index}`;
              const buttonId = `${baseId}-button-${index}`;
              return (
                <div
                  key={faq.question}
                  className={cn(
                    "rounded-xl border transition-colors",
                    expanded
                      ? "border-primary/30 bg-primary/[0.03]"
                      : "bg-card hover:border-foreground/20",
                  )}
                >
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      onClick={() => setOpen(expanded ? null : index)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left"
                    >
                      <span className="flex-1 text-[15px] font-medium leading-snug">
                        {faq.question}
                      </span>
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                          expanded
                            ? "border-primary bg-primary text-primary-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        <Plus
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-200",
                            expanded && "rotate-45",
                          )}
                        />
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        key="panel"
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 pr-12 text-sm leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
