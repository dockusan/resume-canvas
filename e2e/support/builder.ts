import { expect, type Download, type Page } from "@playwright/test";
import { inflateRawSync } from "node:zlib";
import { extractText, getDocumentProxy } from "unpdf";

export const STORAGE_KEY = "resume-storage";

/** Persisted state as the app wrote it to localStorage. */
export interface Saved {
  version: number;
  state: {
    resumeData: {
      personalInfo: Record<string, string>;
      experience: Record<string, unknown>[];
      [key: string]: unknown;
    };
    settings: Record<string, unknown>;
    document: {
      preset: string;
      layout: { columns: 1 | 2; ratio: number };
      sections: { id: string; placement: { column: string } }[];
    };
  };
}

/**
 * Replace `window.print` before the app loads. Headless Chromium has no print
 * dialog, so the test takes the PDF itself (see `printFromMenu`) while the
 * print layout the app prepared is still in place.
 */
export async function stubPrint(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __prints: number; __printClasses: string };
    w.__prints = 0;
    window.print = () => {
      w.__prints++;
      w.__printClasses = document.documentElement.className;
    };
  });
}

/** Open the builder and wait for the first paginated page to render. */
export async function openBuilder(page: Page, path = "/builder") {
  await page.goto(path);
  await waitForPages(page);
}

export async function waitForPages(page: Page) {
  await expect(
    page.locator("[data-page] [data-section-id]").first(),
  ).toBeVisible({
    timeout: 30_000,
  });
}

export async function saved(page: Page): Promise<Saved> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    STORAGE_KEY,
  );
}

/** The first editable field on the page is the name in the header. */
export const nameField = (page: Page) =>
  page.locator("[data-page] [contenteditable=true]").first();

/** Select the whole of an inline field and type over it. */
export async function typeInto(
  page: Page,
  field: ReturnType<Page["locator"]>,
  text: string,
) {
  await field.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type(text);
}

/**
 * A template card in the Document tab. "Compact" is also a density option
 * further down the panel; the template picker comes first.
 */
export const templateCard = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true }).first();

export async function chooseTemplate(page: Page, name: string) {
  await page.getByRole("button", { name: "Document" }).click();
  await templateCard(page, name).click();
}

export async function chooseDownload(page: Page, item: RegExp) {
  await page.getByRole("button", { name: "Download", exact: true }).click();
  await page.getByRole("menuitem", { name: item }).click();
}

/** Trigger a file download from the Download menu and return the file. */
export async function downloadFromMenu(page: Page, item: RegExp) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    chooseDownload(page, item),
  ]);
  return { download, body: await readDownload(download) };
}

export async function readDownload(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

/**
 * Choose a PDF option from the Download menu and capture what it prints.
 * Requires `stubPrint`. The PDF is taken at the moment the app calls
 * `window.print()`, then `afterprint` lets it tear the print layout down.
 */
export async function printFromMenu(page: Page, item: RegExp) {
  const before = await page.evaluate(
    () => (window as unknown as { __prints: number }).__prints,
  );
  await chooseDownload(page, item);
  await page.waitForFunction(
    (n) => (window as unknown as { __prints: number }).__prints > n,
    before,
  );
  const title = await page.title();
  const pdf = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
  });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  return { title, pdf };
}

export interface PdfContent {
  pages: string[];
  /** All text in content-stream order — what a parser reads. */
  text: string;
  /** Link annotations (clickable URLs), in page order. */
  links: string[];
}

export async function readPdf(pdf: Buffer): Promise<PdfContent> {
  const doc = await getDocumentProxy(new Uint8Array(pdf));
  const { text: pages } = await extractText(doc, { mergePages: false });
  const links: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const annotations = await (await doc.getPage(i)).getAnnotations();
    for (const a of annotations) if (a.url) links.push(a.url);
  }
  return { pages, text: pages.join("\n"), links };
}

/**
 * One file out of a zip (a .docx is one). Reads the central directory, so it
 * copes with entries written with data descriptors.
 */
export function readZipEntry(zip: Buffer, name: string): Buffer {
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("Not a zip file");
  const count = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = zip.readUInt16LE(p + 10);
    const size = zip.readUInt32LE(p + 20);
    const nameLength = zip.readUInt16LE(p + 28);
    const extra = zip.readUInt16LE(p + 30);
    const comment = zip.readUInt16LE(p + 32);
    const offset = zip.readUInt32LE(p + 42);
    const entry = zip.toString("utf8", p + 46, p + 46 + nameLength);
    if (entry === name) {
      const local =
        offset +
        30 +
        zip.readUInt16LE(offset + 26) +
        zip.readUInt16LE(offset + 28);
      const data = zip.subarray(local, local + size);
      return method === 0 ? data : inflateRawSync(data);
    }
    p += 46 + nameLength + extra + comment;
  }
  throw new Error(`${name} not found in zip`);
}

/** The visible text of a .docx, one paragraph per line. */
export function docxText(docx: Buffer): string {
  const xml = readZipEntry(docx, "word/document.xml").toString("utf8");
  return xml
    .split(/<\/w:p>/)
    .map((p) =>
      [...p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
        .map((m) => m[1])
        .join(""),
    )
    .filter(Boolean)
    .join("\n")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Hyperlink targets in a .docx (external relationships). */
export function docxLinks(docx: Buffer): string[] {
  const rels = readZipEntry(docx, "word/_rels/document.xml.rels").toString(
    "utf8",
  );
  return [...rels.matchAll(/Target="([^"]+)"[^>]*TargetMode="External"/g)].map(
    (m) => m[1].replace(/&amp;/g, "&"),
  );
}

/** Index of each needle in the haystack; fails the test if one is missing. */
export function positions(haystack: string, needles: string[]): number[] {
  return needles.map((needle) => {
    const at = haystack.indexOf(needle);
    expect(at, `"${needle}" should appear`).toBeGreaterThanOrEqual(0);
    return at;
  });
}

/** Asserts the needles appear in this order. */
export function expectInOrder(haystack: string, needles: string[]) {
  const at = positions(haystack, needles);
  const sorted = [...at].sort((a, b) => a - b);
  expect(at, `expected in order: ${needles.join(" → ")}`).toEqual(sorted);
}
