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
      "Yes. Every template, every styling control, the ATS checker and every export format (PDF, ATS-safe PDF, Word and plain text) are free, with no account and no paywall. The source is MIT licensed, so you can also read it or run it yourself.",
  },
  {
    question: "Where is my resume stored?",
    answer:
      "In your own browser. Nothing is uploaded as you write, there is no sign-up and no analytics. Your resume only leaves your device when you ask it to: when you create a share link, which is encrypted on your device first, or when you use an AI tool. Both are explained below. The trade-off is that your work lives in one browser on one device, so use Export resume file in the builder's menu to keep a copy you can import again.",
  },
  {
    question: "How do I move my resume to another browser or device?",
    answer:
      "Open the builder's menu and choose Export resume file. That saves everything — content, layout and styling — as one small file. On the other browser, choose Import resume file and pick it. A PDF is for sending to employers; the resume file is the one to keep.",
  },
  {
    question: "Can I start from the resume I already have?",
    answer:
      "Yes, where the site has AI tools turned on: upload a PDF, .txt or .md file, or paste the text, and the builder fills itself in. You review what was found before anything changes, then replace your content or add to it, and one undo puts it all back. Without AI, start from the sample and type over it — switching templates later keeps everything you've written.",
  },
  {
    question: "What do the AI tools send, and where?",
    answer:
      "Only what you hand them, only when you click: the resume you import, the few words you give quick add, or the one entry you ask to improve. That text goes to our server and on to an AI model through OpenRouter, and our server keeps no copy. Nothing in your resume changes until you accept the result. They are optional — if a site has them turned off, or you'd rather not use them, everything else works the same. Each address can make 30 AI requests an hour.",
  },
  {
    question: "Can I share my resume with a link?",
    answer:
      "Yes. Creating a link encrypts your resume in your browser and uploads only the encrypted file; the key to decrypt it is placed after the # in the link, which browsers never send to a server. So we store something we cannot read, and anyone you give the full link to can view and download the resume. You choose how long the link lasts — after that the file is deleted automatically.",
  },
  {
    question: "Will the PDF look exactly like the preview?",
    answer:
      "Yes. The preview renders real page boxes and the PDF is produced by printing those same pages with your browser's own engine, so there is no second renderer that could disagree with what you see. Links in the PDF stay clickable.",
  },
  {
    question: "Is the output ATS-friendly?",
    answer:
      "Yes. PDFs keep real, selectable text in reading order. Multi-column layouts can still confuse older tracking systems, so the Download menu also offers an ATS-safe PDF (the same content in one clean column), a Word file and plain text. The ATS tab scores your resume against common parser and recruiter checks, and matches it against a job description you paste in, all without leaving your browser.",
  },
  {
    question: "Can I change a template after I start?",
    answer:
      "Yes, and you keep everything you have written — switching only replaces the styling. You can also change columns, colours, fonts, spacing, section order and per-field visibility without touching a template at all.",
  },
  {
    question: "How many pages can my resume be?",
    answer:
      "As many as you need. The builder shows real page breaks as you type, tells you the page count, and lets you force a section onto a new page or keep it from splitting. Running a little long? Fit to 1 page (or 2) tightens spacing, then line height, then text size only if it must, and one undo reverts it.",
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
