/**
 * Inline rich text.
 *
 * Stored as a constrained HTML string in the same fields that used to hold
 * plain text, so nothing needs migrating — a plain string is already valid
 * input. Everything round-trips through `Run[]`, which is what makes the
 * format safe (rendering never injects HTML) and what gives the ATS export a
 * plain-text view.
 */

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  link?: string;
  /** Relative size as an em multiplier, so it scales with the theme. */
  size?: number;
  color?: string;
}

/**
 * `execCommand("fontSize")` only speaks the 1–7 ladder, so map those to em
 * multipliers. Storing a multiplier keeps text relative to the field's own
 * size rather than freezing it at a pixel value.
 */
export const FONT_SIZE_STEPS = [0.7, 0.8, 0.9, 1, 1.15, 1.35, 1.6];

const KEYWORD_SIZES: Record<string, number> = {
  "xx-small": 0.7,
  "x-small": 0.8,
  small: 0.9,
  medium: 1,
  large: 1.15,
  "x-large": 1.35,
  "xx-large": 1.6,
};

/** Nearest ladder index (1–7) for an em multiplier. */
export function stepForSize(size: number): number {
  let best = 3;
  FONT_SIZE_STEPS.forEach((v, i) => {
    if (Math.abs(v - size) < Math.abs(FONT_SIZE_STEPS[best] - size)) best = i;
  });
  return best + 1;
}

/** Pasted or tampered markup must not be able to blow out the layout. */
const MIN_SIZE = 0.5;
const MAX_SIZE = 3;

function clampSize(value: number): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, value));
}

function parseSize(style: string): number | undefined {
  const match = style.match(/font-size:\s*([^;]+)/i);
  if (!match) return undefined;
  const raw = match[1].trim().toLowerCase();
  if (KEYWORD_SIZES[raw]) return KEYWORD_SIZES[raw];
  const em = raw.match(/^([\d.]+)em$/);
  if (em) return clampSize(parseFloat(em[1]));
  const pct = raw.match(/^([\d.]+)%$/);
  if (pct) return clampSize(parseFloat(pct[1]) / 100);
  return undefined;
}

/** Only concrete colours are kept; anything exotic is dropped. */
function parseColor(style: string): string | undefined {
  const match = style.match(/(?:^|;)\s*color:\s*([^;]+)/i);
  if (!match) return undefined;
  const value = match[1].trim();
  return /^(#[0-9a-f]{3,8}|rgba?\([\d.,\s%]+\)|[a-z]+)$/i.test(value)
    ? value
    : undefined;
}

const DROPPED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "TEMPLATE",
  "NOSCRIPT",
]);

const BLOCK_TAGS = new Set([
  "DIV",
  "P",
  "LI",
  "UL",
  "OL",
  "BR",
  "H1",
  "H2",
  "H3",
  "H4",
]);

const ALLOWED_SCHEME = /^(https?|mailto|tel):/i;
/** Any scheme-looking prefix, so `javascript:` can't be smuggled through. */
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Bare domains are common in resumes; make them real links. */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim().replace(/[\u0000-\u001f]/g, "");
  if (!trimmed) return "";
  if (ALLOWED_SCHEME.test(trimmed)) return trimmed;
  // A disallowed scheme is rejected outright rather than prefixed — otherwise
  // `javascript:…` would survive as `https://javascript:…`.
  if (ANY_SCHEME.test(trimmed)) return "";
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(trimmed)) return `mailto:${trimmed}`;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

/** Only these schemes may end up in an href. */
function safeHref(url: string): string | undefined {
  const normalized = normalizeUrl(url);
  return ALLOWED_SCHEME.test(normalized) ? normalized : undefined;
}

function pushRun(runs: Run[], run: Run) {
  if (!run.text) return;
  const prev = runs[runs.length - 1];
  if (
    prev &&
    !!prev.bold === !!run.bold &&
    !!prev.italic === !!run.italic &&
    !!prev.underline === !!run.underline &&
    prev.link === run.link &&
    prev.size === run.size &&
    prev.color === run.color
  ) {
    prev.text += run.text;
    return;
  }
  runs.push({ ...run });
}

/**
 * Parse a fragment into runs, normalising however the browser chose to encode
 * a format — `contentEditable` emits `<b>`, `<strong>` or an inline style
 * depending on the browser and the command used.
 */
export function parseRuns(html: string): Run[] {
  if (!html) return [];
  // No DOM (SSR, tests): treat the value as plain text.
  if (typeof document === "undefined") {
    return html.includes("<") ? [] : [{ text: html }];
  }

  // DOMParser yields an inert document: no scripts run, no resources load, so
  // an `<img onerror>` in stored markup cannot fire while we inspect it.
  // Assigning to a detached element's innerHTML would not be safe here.
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const container = parsed.body;
  const runs: Run[] = [];

  const walk = (node: Node, marks: Omit<Run, "text">) => {
    if (node.nodeType === Node.TEXT_NODE) {
      pushRun(runs, { ...marks, text: node.textContent ?? "" });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    if (el.tagName === "BR") {
      pushRun(runs, { text: "\n" });
      return;
    }
    // Drop these subtrees entirely; their text content is not document text.
    if (DROPPED_TAGS.has(el.tagName)) return;

    const style = el.getAttribute("style") ?? "";
    const next: Omit<Run, "text"> = {
      bold:
        marks.bold ||
        el.tagName === "B" ||
        el.tagName === "STRONG" ||
        /font-weight:\s*(bold|[6-9]00)/i.test(style),
      italic:
        marks.italic ||
        el.tagName === "I" ||
        el.tagName === "EM" ||
        /font-style:\s*italic/i.test(style),
      underline:
        marks.underline ||
        el.tagName === "U" ||
        /text-decoration[^;]*underline/i.test(style),
      link:
        el.tagName === "A"
          ? safeHref(el.getAttribute("href") ?? "")
          : marks.link,
      size: parseSize(style) ?? marks.size,
      color: parseColor(style) ?? marks.color,
    };

    const isBlock = BLOCK_TAGS.has(el.tagName);
    // A block that follows content starts a new line.
    if (isBlock && runs.length && !runs[runs.length - 1].text.endsWith("\n")) {
      pushRun(runs, { text: "\n" });
    }
    el.childNodes.forEach((child) => walk(child, next));
  };

  container.childNodes.forEach((child) => walk(child, {}));
  return runs.filter((r) => r.text.length > 0);
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function serializeRuns(runs: Run[]): string {
  return runs
    .map((run) => {
      let html = escapeHtml(run.text);
      if (run.bold) html = `<b>${html}</b>`;
      if (run.italic) html = `<i>${html}</i>`;
      if (run.underline) html = `<u>${html}</u>`;
      if (run.size || run.color) {
        const css = [
          run.size ? `font-size:${run.size}em` : "",
          run.color ? `color:${escapeHtml(run.color)}` : "",
        ]
          .filter(Boolean)
          .join(";");
        html = `<span style="${css}">${html}</span>`;
      }
      if (run.link) html = `<a href="${escapeHtml(run.link)}">${html}</a>`;
      return html;
    })
    .join("");
}

/** Round-trip through runs, which drops everything not on the allowlist. */
export function sanitizeInline(html: string): string {
  return serializeRuns(parseRuns(html));
}

export function toPlainText(value: string): string {
  if (!value.includes("<")) return value;
  return parseRuns(value)
    .map((r) => r.text)
    .join("");
}

export const hasMarkup = (value: string) => /<[a-z]/i.test(value);
