# Contributing to Resume Canvas

Thanks for helping. Bug reports, fixes, templates, translations of the
guidance, and plain "this confused me" issues are all welcome.

## Ground rules

- **Privacy is the product.** A resume is saved in the visitor's browser and
  leaves it only when they ask: a share link (encrypted first) or an AI tool.
  A change that sends anything new off the device — including analytics or
  telemetry — needs to say so in the pull request and update the privacy page
  and FAQ. Changes that add tracking won't be accepted.
- **The PDF is the preview.** Exports are printed from the paginated preview
  by the browser. Fix layout in the preview and the PDF follows; there is no
  second renderer to keep in sync.
- **Claims must be true.** Copy on the site states what the app does today —
  counts, formats, where data goes. Please keep it that way.

## Getting set up

You need Node.js 22+ and pnpm 10 (`corepack enable` gives you the version
pinned in `package.json`).

```bash
pnpm install
cp .env.example .env.local   # optional; everything works without it
pnpm dev                     # http://localhost:3000
```

Share links and AI features need the variables in `.env.example`; without
them the app runs and simply hides those buttons (share links fall back to an
in-memory store in development).

## Before you open a pull request

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm format:check     # pnpm format fixes it
pnpm build
pnpm test:e2e         # Playwright, against Chromium
```

`pnpm test:e2e` starts the dev server itself. To reuse one that's already
running, set `E2E_BASE_URL=http://localhost:3000`; to use an installed Chrome
instead of Playwright's download, set `CHROME_PATH`. With a production server
running, `BASE_URL=http://localhost:3000 pnpm check:links` checks every
internal link and anchor.

CI runs all of the above on every pull request.

### Tests

End-to-end tests live in `e2e/` and drive the real builder. Exports are
checked from the files themselves: PDFs are captured at the moment the app
calls `print()` and read back with `unpdf` (text order, page count, links),
Word files are unzipped and read. If you change what the builder renders or
exports, add or update a test that shows it.

## Pull requests

- One change per pull request, with a title in the
  [Conventional Commits](https://www.conventionalcommits.org/) style the history
  uses (`feat: …`, `fix: …`, `chore: …`).
- Say what changed and why; for anything visible, include before/after
  screenshots (and a phone width if layout changed).
- Keep unrelated clean-ups for a separate pull request.

## Project map

| Path                          | What's there                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `app/`                        | Routes: the site, `/builder`, `/templates`, shared links (`/r/[id]`), API routes |
| `components/builder/`         | The editor: canvas, inspector, toolbar, content mode, AI dialogs                 |
| `components/builder/preview/` | The paginated preview — which is also the PDF                                    |
| `lib/schema/`                 | The document model, templates (`presets.ts`) and the template catalog            |
| `lib/pagination/`             | Measuring sections and distributing them onto pages                              |
| `lib/export/`                 | ATS text, Word, backup files                                                     |
| `lib/ats/`                    | ATS checks, keyword and requirement matching                                     |
| `lib/ai/`                     | AI routes' prompts, validation and client calls                                  |
| `e2e/`                        | Playwright tests                                                                 |

## Adding a template

Templates are data, not components: add a builder to `lib/schema/presets.ts`,
then describe who it suits in `lib/schema/template-catalog.ts`. The gallery,
its filters, the builder's picker and the `/templates/<id>` page pick it up
from there.

## Reporting security issues

Please don't open a public issue — see [SECURITY.md](SECURITY.md).

## Code of conduct

Be kind and assume good intent. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
