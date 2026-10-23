import { expect, test } from "@playwright/test";
import {
  STORAGE_KEY,
  chooseTemplate,
  docxLinks,
  docxText,
  downloadFromMenu,
  expectInOrder,
  nameField,
  openBuilder,
  printFromMenu,
  readPdf,
  saved,
  stubPrint,
  templateCard,
  typeInto,
  waitForPages,
} from "./support/builder";

/**
 * The whole builder journey a visitor takes: pick a template, edit, come back
 * after a reload, and leave with a file in every format the app offers.
 */

test.beforeEach(async ({ page }) => {
  await stubPrint(page);
});

test.describe("template selection", () => {
  test("restyles the page, keeps the content and survives a reload", async ({
    page,
  }) => {
    await openBuilder(page);
    const before = (await saved(page)).state.resumeData;

    await chooseTemplate(page, "Clean");
    await expect
      .poll(async () => (await saved(page)).state.document.preset)
      .toBe("clean");
    const after = await saved(page);
    expect(after.state.document.layout.columns).toBe(1);
    expect(after.state.resumeData).toEqual(before);

    await page.reload();
    await waitForPages(page);
    expect((await saved(page)).state.document.preset).toBe("clean");
    await page.getByRole("button", { name: "Document" }).click();
    await expect(templateCard(page, "Clean")).toHaveClass(/border-primary/);
  });

  test("every template renders without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await openBuilder(page);
    await page.getByRole("button", { name: "Document" }).click();
    const names = [
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
    for (const name of names) {
      await templateCard(page, name).click();
      await expect(page.locator("[data-page]").first()).toContainText(
        "Senior Software Engineer",
      );
    }
    expect(errors).toEqual([]);
  });
});

test.describe("editing", () => {
  test("an inline edit is saved and survives a reload", async ({ page }) => {
    await openBuilder(page);
    await typeInto(page, nameField(page), "Ada Lovelace");
    await page.keyboard.press("Enter");

    expect((await saved(page)).state.resumeData.personalInfo.fullName).toBe(
      "Ada Lovelace",
    );
    await page.reload();
    await waitForPages(page);
    await expect(nameField(page)).toHaveText("Ada Lovelace");
  });

  test("an edit still being typed survives a reload", async ({ page }) => {
    await openBuilder(page);
    // No Enter, no click elsewhere: the field still has focus when the page
    // goes away. This used to be lost.
    await typeInto(page, nameField(page), "Grace Hopper");
    await page.reload();
    await waitForPages(page);
    await expect(nameField(page)).toHaveText("Grace Hopper");
  });

  test("Content mode edits are saved and survive a reload", async ({
    page,
  }) => {
    await openBuilder(page);
    await page.getByRole("button", { name: /Content/ }).click();
    await page
      .getByLabel("Full name", { exact: true })
      .fill("Katherine Johnson");
    await page.reload();
    await page.getByRole("button", { name: /Content/ }).click();
    await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
      "Katherine Johnson",
    );
  });

  test("undo puts back the previous value", async ({ page }) => {
    await openBuilder(page);
    await typeInto(page, nameField(page), "Someone Else");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: /^Undo/ }).click();
    await expect(nameField(page)).toHaveText("John Doe");
  });
});

test.describe("refresh recovery", () => {
  test("an unreadable save opens the editor and is kept aside", async ({
    page,
  }) => {
    await openBuilder(page);
    await page.evaluate(
      (key) => localStorage.setItem(key, "{not json"),
      STORAGE_KEY,
    );
    await page.reload();
    // Used to spin on "Loading Resume" forever.
    await waitForPages(page);
    expect(
      await page.evaluate(() =>
        localStorage.getItem("resume-storage-unreadable"),
      ),
    ).toBe("{not json");
  });

  test("a save with the wrong shape is repaired, keeping what is valid", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await openBuilder(page);
    await page.evaluate((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 4,
          state: {
            resumeData: {
              personalInfo: { fullName: "Partial Person" },
              experience: [null, { id: "x", title: "Kept role" }],
              skills: "not a list",
            },
            settings: "not an object",
          },
        }),
      );
    }, STORAGE_KEY);
    await page.reload();
    await waitForPages(page);
    const sheet = page.locator("[data-page]").first();
    await expect(sheet).toContainText("Partial Person");
    await expect(sheet).toContainText("Kept role");
    expect(errors).toEqual([]);
  });

  test("a backup file exports and imports back", async ({ page }) => {
    await openBuilder(page);
    await typeInto(page, nameField(page), "Backed Up");
    await page.keyboard.press("Enter");

    await page.getByRole("button", { name: "More" }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("menuitem", { name: /Export resume file/ }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("Backed_Up.resume.json");
    const file = await download.path();
    // Let the menu finish closing, or the next keystrokes land in it.
    await expect(page.getByRole("menu")).toBeHidden();

    // Change the resume, then restore the backup over it.
    await typeInto(page, nameField(page), "Changed Since");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "More" }).click();
    const [chooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("menuitem", { name: /Import resume file/ }).click(),
    ]);
    await chooser.setFiles(file);
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Import" })
      .click();
    await waitForPages(page);
    await expect(nameField(page)).toHaveText("Backed Up");
  });

  test("a file that isn't a backup is refused with a reason", async ({
    page,
  }) => {
    await openBuilder(page);
    await page.getByRole("button", { name: "More" }).click();
    const [chooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("menuitem", { name: /Import resume file/ }).click(),
    ]);
    await chooser.setFiles({
      name: "notes.json",
      mimeType: "application/json",
      buffer: Buffer.from("{nope"),
    });
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: "Import" }).click();
    await expect(dialog).toContainText("That file isn't valid JSON.");
    await expect(nameField(page)).toHaveText("John Doe");
  });
});

test.describe("exports", () => {
  test("PDF: named after the person, real text and working links", async ({
    page,
  }) => {
    await openBuilder(page);
    const { title, pdf } = await printFromMenu(page, /^PDF/);
    expect(title).toBe("John_Doe_Resume");

    const { pages, text, links } = await readPdf(pdf);
    expect(pages).toHaveLength(1);
    // Classic sets the name in capitals, and the PDF text follows suit.
    expectInOrder(text, [
      "JOHN DOE",
      "Senior Software Engineer",
      "Tech Solutions Inc.",
      "Led the migration of legacy monolith to microservices architecture.",
    ]);
    expect(links).toEqual(
      expect.arrayContaining([
        "https://linkedin.com/in/johndoe",
        "https://github.com/johndoe/ecommerce",
      ]),
    );
    // Editor furniture never reaches the file.
    for (const furniture of ["Description (optional)", "Add section here"]) {
      expect(text).not.toContain(furniture);
    }
    // The print layout is torn down once printing is over.
    await expect(page.locator("html")).not.toHaveClass(/rc-printing/);
  });

  test("ATS-safe PDF: one column, each heading followed by its entries", async ({
    page,
  }) => {
    await openBuilder(page);
    // A sidebar-left template: the hardest case for reading order.
    await chooseTemplate(page, "Banner");
    const { title, pdf } = await printFromMenu(page, /ATS-safe PDF/);
    expect(title).toBe("John_Doe_Resume_ATS");

    const { text } = await readPdf(pdf);
    // Headings used to be emitted all together, before any of the entries.
    expectInOrder(text, [
      "SUMMARY",
      "Experienced Software Engineer",
      "WORK EXPERIENCE",
      "Senior Software Engineer | Jan 2022",
      "EDUCATION",
      "Master of Science in Computer Science",
      "PROJECTS",
      "E-commerce Platform",
    ]);
    await expect(page.locator("html")).not.toHaveClass(/rc-print-ats/);
  });

  test("Word: main column first, with contact hyperlinks", async ({ page }) => {
    await openBuilder(page);
    await chooseTemplate(page, "Banner");
    const { download, body } = await downloadFromMenu(page, /Word/);
    expect(download.suggestedFilename()).toBe("John_Doe_Resume.docx");

    const text = docxText(body);
    // Banner's sidebar is on the left; it used to come first.
    expectInOrder(text, [
      "John Doe",
      "SUMMARY",
      "WORK EXPERIENCE",
      "Led the migration of legacy monolith",
      "STRENGTHS",
      "LANGUAGES",
    ]);
    expect(docxLinks(body)).toEqual(
      expect.arrayContaining(["https://linkedin.com/in/johndoe"]),
    );
  });

  test("plain text: main column first, one bullet per line", async ({
    page,
  }) => {
    await openBuilder(page);
    await chooseTemplate(page, "Banner");
    const { download, body } = await downloadFromMenu(page, /Plain text/);
    expect(download.suggestedFilename()).toBe("John_Doe_Resume_ATS.txt");

    const text = body.toString("utf8");
    expectInOrder(text, [
      "John Doe",
      "SUMMARY",
      "WORK EXPERIENCE",
      "STRENGTHS",
    ]);
    expect(text).toContain(
      "\n- Led the migration of legacy monolith to microservices architecture.\n",
    );
  });

  test("Ctrl/Cmd+P prints through the same preparation as the menu", async ({
    page,
  }) => {
    await openBuilder(page);
    await page.keyboard.press("ControlOrMeta+P");
    await page.waitForFunction(
      () => (window as unknown as { __prints: number }).__prints > 0,
    );
    expect(
      await page.evaluate(
        () => (window as unknown as { __printClasses: string }).__printClasses,
      ),
    ).toContain("rc-printing");
  });
});
