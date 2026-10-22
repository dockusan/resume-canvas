# Resume Canvas

**A free, open-source resume builder that keeps your resume in your browser.**
Edit right on the page with real page breaks, then download a PDF that matches
it exactly — or an ATS-safe PDF, a Word file or plain text. No account, no
paywall, no tracking.

<p align="center">
  <a href="https://resumecanvas.site"><b>Try it</b></a> •
  <a href="https://resumecanvas.site/templates">Templates</a> •
  <a href="#run-it-yourself">Run it yourself</a> •
  <a href="CONTRIBUTING.md">Contribute</a>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow.svg"></a>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-black">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-blue">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-blue">
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/preview-dark.png">
  <img alt="The Resume Canvas builder: a two-column resume on the page, with section styling in the panel on the right" src="public/preview-light.png">
</picture>

## Why it's different

- **Your resume stays on your device.** It's saved in your browser as you
  type. It only leaves when you ask: a share link (encrypted in your browser
  first, so the server stores something it can't read) or an AI tool, which
  sends just what that tool needs. There are no analytics.
- **The PDF is the preview.** The editor renders real page boxes and the PDF
  is printed from them by your browser, so there's no second renderer that
  could disagree with what you see. Text is selectable, in reading order, and
  links stay clickable.
- **It's yours to run.** MIT licensed, a single Next.js app, no database.

## Features

- **Edit on the page.** Click any line and type; page breaks move as you write.
  A form-based Content mode for phones, and drag-and-drop to arrange sections
  across columns and pages.
- **Fourteen templates**, from ATS-first single columns to sidebars, banners
  and cards — browse them with the sample resume at
  [/templates](https://resumecanvas.site/templates), filtered by role, layout
  and photo. Switching keeps everything you've written.
- **Real typography controls:** twenty font pairings, eight colour palettes,
  text size, line spacing, heading styles and density, with per-item overrides.
- **Every export format:** PDF exactly as designed, an ATS-safe one-column
  PDF, Word (`.docx`) and plain text, plus a resume file to move between
  browsers.
- **ATS tools:** a scored checklist (contact details, dates, bullet quality,
  numbers, headings, layout, length) and matching against a job description
  you paste in.
- **Optional AI** (when the deployment configures a key): import an existing
  resume from PDF or text, draft entries from a few words, improve an entry's
  points. Nothing changes until you accept it.
- **Share links** that are encrypted end to end and expire on a schedule you
  choose.
- Undo/redo, light and dark themes, and Fit to one page.

## Run it yourself

You need Node.js 22+ and pnpm 10 (`corepack enable` picks the pinned version).

```bash
git clone https://github.com/kstmostofa/resume-canvas.git
cd resume-canvas
pnpm install
pnpm dev            # http://localhost:3000
```

Everything works without configuration. To turn on the optional parts, copy
`.env.example` to `.env.local` and fill in what you need:

| Variable                                             | What it does                                                                                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                               | Your deployment's public URL, for canonical links, the sitemap and social cards. Defaults to `https://resumecanvas.site`.                                   |
| `NEXT_PUBLIC_REPO_URL`                               | Your repository, for the site's GitHub links. Defaults to this repo.                                                                                        |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Any Upstash-compatible Redis REST endpoint, for share links and AI rate limits. Unset, development uses memory; a production build refuses to create links. |
| `OPENROUTER_API_KEY`                                 | Turns on the AI tools. Unset, their buttons don't appear. Set a credit limit on the key as a backstop.                                                      |
| `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL`            | Choose the model (any with structured outputs), or point at another OpenAI-compatible endpoint.                                                             |

`NEXT_PUBLIC_*` values are read at build time.

### Deploying

It's a standard Next.js app: `pnpm build && pnpm start` on any Node 22 host,
or any platform that builds Next.js (Vercel, Coolify, Railway, a Docker
image built with Nixpacks or Railpack). There is no database; share links
use the Redis store above.

### Scripts

| Command                               | What it does                                       |
| ------------------------------------- | -------------------------------------------------- |
| `pnpm dev`                            | Development server                                 |
| `pnpm build` / `pnpm start`           | Production build and server                        |
| `pnpm lint`, `pnpm exec tsc --noEmit` | Lint and typecheck                                 |
| `pnpm format` / `pnpm format:check`   | Prettier                                           |
| `pnpm test:e2e`                       | Playwright end-to-end tests, including the exports |
| `BASE_URL=… pnpm check:links`         | Checks every internal link on a running site       |

## Contributing

Bug reports, fixes and new templates are welcome. Start with
[CONTRIBUTING.md](CONTRIBUTING.md); security issues go through
[SECURITY.md](SECURITY.md).

## Tech

[Next.js 16](https://nextjs.org/) (App Router) · React 19 · TypeScript ·
[Tailwind CSS 4](https://tailwindcss.com/) ·
[shadcn/ui](https://ui.shadcn.com/) on Radix ·
[Zustand](https://github.com/pmndrs/zustand) with
[zundo](https://github.com/charkour/zundo) for undo ·
[docx](https://docx.js.org/) for Word export ·
[unpdf](https://github.com/unjs/unpdf) for PDF import ·
[Playwright](https://playwright.dev/) for tests

## License and credits

[MIT](LICENSE). Created by [Md Mostafijur Rahman](https://github.com/kstmostofa).

Eight of the templates (Accent Panel, Banner, Duotone, Soft Sidebar, Centered,
Cards, Spotlight, Framed) are adapted from
[Reactive Resume](https://github.com/reactive-resume/reactive-resume)'s
Chikorita, Ditto, Gengar, Glalie, Kakuna, Lapras, Pikachu and Porygon (MIT,
© Amruth Pillai).
