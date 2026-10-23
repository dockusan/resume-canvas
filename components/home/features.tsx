"use client";

import { motion } from "framer-motion";
import {
  Download,
  Github,
  Lock,
  MousePointerClick,
  Palette,
  ShieldCheck,
} from "lucide-react";

/**
 * Each card names something a visitor can check in the builder within a
 * minute — counts, formats, where data goes — rather than adjectives.
 */
const features = [
  {
    icon: <MousePointerClick className="h-6 w-6 text-primary" />,
    title: "Edit on the page itself",
    description:
      "Click any line of the preview and type. Page breaks are real and move as you write, so you always know what fits.",
  },
  {
    icon: <Lock className="h-6 w-6 text-primary" />,
    title: "Stays in your browser",
    description:
      "Saved on your device as you type, with no account and no analytics. It leaves only when you create a share link, encrypted first, or use an AI tool.",
  },
  {
    icon: <Download className="h-6 w-6 text-primary" />,
    title: "Every format you'll be asked for",
    description:
      "A PDF exactly as designed, an ATS-safe one-column PDF, a Word file and plain text — from the same content.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    title: "ATS check built in",
    description:
      "A scored checklist for contact details, dates, bullet quality, numbers and length, plus keyword matching against a job description you paste in.",
  },
  {
    icon: <Palette className="h-6 w-6 text-primary" />,
    title: "Fourteen templates, all restylable",
    description:
      "Twenty font pairings, eight colour palettes, one or two columns and adjustable spacing. Switching template keeps everything you've written.",
  },
  {
    icon: <Github className="h-6 w-6 text-primary" />,
    title: "Open source",
    description:
      "MIT licensed. Read exactly what the code does with your data, run your own copy, or contribute on GitHub.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            What&rsquo;s in the builder
          </h2>
          <p className="text-lg text-muted-foreground">
            All of it free, none of it behind an account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
