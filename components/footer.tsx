import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";
import { SITE } from "@/lib/seo";

const REPO = SITE.repo;

/**
 * Only pages that exist. The previous list linked to Examples, Blog, Docs,
 * Community and Help — none of which were ever built, so every page on the
 * site shipped five links straight to a 404.
 */
const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Builder", href: "/builder" },
      { label: "Templates", href: "/templates" },
      { label: "Features", href: "/#features" },
      { label: "Questions", href: "/#faq" },
    ],
  },
  {
    title: "Open source",
    links: [
      { label: "Source code", href: REPO, external: true },
      { label: "Report an issue", href: `${REPO}/issues`, external: true },
      { label: "Releases", href: `${REPO}/releases`, external: true },
      {
        label: "MIT licence",
        href: `${REPO}/blob/main/LICENSE`,
        external: true,
      },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
      { label: "Cookie policy", href: "/cookies" },
    ],
  },
];

const socialLinks = [
  {
    icon: Github,
    href: REPO,
    label: "GitHub",
  },
  { icon: Twitter, href: "https://x.com/Mostofa_Me", label: "Twitter" },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/in/mostofa-me",
    label: "LinkedIn",
  },
];

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl mb-4"
            >
              <span className="text-primary">Resume</span>Canvas
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              The free and open-source resume builder. Create professional
              resumes in minutes without sharing your data.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-full"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {footerLinks.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      {...("external" in link && link.external
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Resume Canvas. All rights reserved.
          </p>
          <p>
            Built with <span className="text-red-500">♥</span> by the Open
            Source Community
          </p>
        </div>
      </div>
    </footer>
  );
}
