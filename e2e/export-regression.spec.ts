import { expect, test, type Page } from "@playwright/test";
import {
  chooseTemplate,
  docxLinks,
  docxText,
  downloadFromMenu,
  expectInOrder,
  flat,
  overflowingItems,
  printFromMenu,
  readPdf,
  stubPrint,
  type PdfContent,
} from "./support/builder";
import {
  LINKS,
  bulletText,
  choosePaper,
  linkResume,
  loadResume,
  longResume,
  oversizedRole,
  shownPageCount,
} from "./support/fixtures";

/**
 * Regression suite for the files people actually send: pagination, text
 * extraction, hyperlinks and long resumes, in every export format.
 */

const TEMPLATES = [
  "Classic",
  "Modern Sidebar",
  "Clean",
  "Minimal",
  "Executive",
  "Compact",
  "Accent Panel",
  "Banner",
  "Duotone",
  "Soft Sidebar",
  "Centered",
  "Cards",
  "Spotlight",
  "Framed",
];

/** In PDF points, as the print engine writes them. */
const A4 = { width: 596, height: 842 };
const LETTER = { width: 612, height: 792 };

const ROLES = 7;
const BULLETS = 6;
const allBullets = () =>
  Array.from({ length: ROLES }, (_, r) =>
    Array.from({ length: BULLETS }, (_, b) => bulletText(r + 1, b + 1)),
  ).flat();

const count = (haystack: string, needle: string) =>
  haystack.split(needle).length - 1;

/** Every bullet present exactly once — nothing lost, nothing doubled. */
function expectEveryBulletOnce(text: string) {
  const all = flat(text);
  const wrong = allBullets().filter((b) => count(all, b) !== 1);
  expect(wrong, "bullets missing or repeated").toEqual([]);
}

/** No bullet is split across two pages. */
function expectBulletsWholeOnAPage(pdf: PdfContent) {
  const pages = pdf.pages.map(flat);
  const split = allBullets().filter((b) => !pages.some((p) => p.includes(b)));
  expect(split, "bullets split across a page break").toEqual([]);
}

function expectNoBlankPages(pdf: PdfContent) {
  const blank = pdf.pages
    .map((text, i) => (text.trim() ? null : i + 1))
    .filter((i) => i !== null);
  expect(blank, "blank pages").toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await stubPrint(page);
});

test.describe("long resumes: designed PDF", () => {
  for (const template of TEMPLATES) {
    test(template, async ({ page }) => {
      await loadResume(page, longResume());
      await chooseTemplate(page, template);

      // Nothing is cut off at the bottom of a page box.
      expect(await overflowingItems(page)).toEqual([]);

      const { pdf } = await printFromMenu(page, /^PDF/);
      const content = await readPdf(pdf);

      // The PDF has the length the builder promised, on the right paper.
      expect(content.pages.length).toBeGreaterThan(1);
      expect(content.pages.length).toBe(await shownPageCount(page));
      for (const size of content.sizes) expect(size).toEqual(A4);

      expectEveryBulletOnce(content.text);
      expectBulletsWholeOnAPage(content);
      expectNoBlankPages(content);
      expectInOrder(
        flat(content.text),
        Array.from({ length: ROLES }, (_, i) => `Role ${i + 1} Engineer`),
      );
    });
  }
});

test.describe("long resumes: other formats", () => {
  test.beforeEach(async ({ page }) => {
    await loadResume(page, longResume());
  });

  test("ATS-safe PDF keeps every line, in order, on one column", async ({
    page,
  }) => {
    const { pdf } = await printFromMenu(page, /ATS-safe PDF/);
    const content = await readPdf(pdf);
    expect(content.pages.length).toBeGreaterThan(1);
    for (const size of content.sizes) expect(size).toEqual(A4);
    expectEveryBulletOnce(content.text);
    expectBulletsWholeOnAPage(content);
    expectNoBlankPages(content);
    // Headings are plain words a parser can match, not tracked capitals.
    expectInOrder(content.text, [
      "SUMMARY",
      "WORK EXPERIENCE",
      "Role 1 Engineer",
      "Role 7 Engineer",
      "EDUCATION",
      "PROJECTS",
    ]);
  });

  test("Word keeps every line, in order", async ({ page }) => {
    const { body } = await downloadFromMenu(page, /Word/);
    const text = docxText(body);
    expectEveryBulletOnce(text);
    expectInOrder(
      text,
      Array.from({ length: ROLES }, (_, i) => `Role ${i + 1} Engineer`),
    );
  });

  test("plain text keeps every line, one bullet per line", async ({ page }) => {
    const { body } = await downloadFromMenu(page, /Plain text/);
    const text = body.toString("utf8");
    expectEveryBulletOnce(text);
    for (const bullet of allBullets()) expect(text).toContain(`- ${bullet}\n`);
  });
});

test.describe("paper size", () => {
  test("Letter prints on Letter pages in both PDFs", async ({ page }) => {
    await loadResume(page, longResume());
    await choosePaper(page, "Letter");

    for (const item of [/^PDF/, /ATS-safe PDF/]) {
      const content = await readPdf((await printFromMenu(page, item)).pdf);
      for (const size of content.sizes) expect(size).toEqual(LETTER);
      expectEveryBulletOnce(content.text);
    }
  });
});

test.describe("empty sections", () => {
  test("never add a blank page to the PDF", async ({ page }) => {
    // One role that fills a page leaves the empty Education and Projects
    // sections to spill over. They print nothing, and used to print a page.
    await loadResume(page, oversizedRole());
    const content = await readPdf((await printFromMenu(page, /^PDF/)).pdf);
    expectNoBlankPages(content);
  });
});

test.describe("an entry longer than a page", () => {
  test("is flagged in the editor rather than cut off silently", async ({
    page,
  }) => {
    await loadResume(page, oversizedRole());
    await expect(
      page.getByRole("alert").filter({ hasText: "longer than a whole page" }),
    ).toBeVisible();
  });

  test("an ordinary resume shows no such warning", async ({ page }) => {
    await loadResume(page, longResume());
    await expect(
      page.getByRole("alert").filter({ hasText: "longer than a whole page" }),
    ).toHaveCount(0);
  });
});

test.describe("hyperlinks", () => {
  // Chrome writes a bare origin with its trailing slash; compare URLs, not
  // spellings.
  const norm = (url: string) =>
    /^https?:/.test(url) ? new URL(url).href : url;
  const expectAllLinks = (links: string[]) =>
    expect(links.map(norm)).toEqual(
      expect.arrayContaining(Object.values(LINKS).map(norm)),
    );

  async function load(page: Page) {
    await loadResume(page, linkResume());
  }

  test("designed PDF: every link is clickable", async ({ page }) => {
    await load(page);
    const { links } = await readPdf((await printFromMenu(page, /^PDF/)).pdf);
    expectAllLinks(links);
  });

  test("ATS-safe PDF: every link is clickable", async ({ page }) => {
    await load(page);
    const { links } = await readPdf(
      (await printFromMenu(page, /ATS-safe PDF/)).pdf,
    );
    expectAllLinks(links);
  });

  test("Word: every link is a hyperlink", async ({ page }) => {
    await load(page);
    const { body } = await downloadFromMenu(page, /Word/);
    expectAllLinks(docxLinks(body));
    // A link inside a bullet keeps its words.
    expect(docxText(body)).toContain(
      "Published a case study read by the whole industry",
    );
  });

  test("clicking a header link while editing edits it", async ({ page }) => {
    await load(page);
    const website = page
      .locator("[data-page] a[href='https://ada.example.dev']")
      .first();
    const popups: unknown[] = [];
    page.on("popup", (p) => popups.push(p));
    await website.getByText("ada.example.dev").click();
    await expect(website.locator("[contenteditable=true]")).toBeFocused();
    expect(popups).toEqual([]);
  });
});
