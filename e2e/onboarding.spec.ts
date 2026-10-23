import { expect, test, type Page } from "@playwright/test";
import {
  STORAGE_KEY,
  chooseTemplate,
  nameField,
  saved,
  typeInto,
  waitForPages,
} from "./support/builder";

/** A first visit: no saved resume and no tour progress in this browser. */
async function firstVisit(page: Page) {
  await page.goto("/builder");
  await waitForPages(page);
}

const welcome = (page: Page) =>
  page.getByRole("dialog", { name: "Let’s make your resume" });
const tour = (page: Page) => page.getByRole("region", { name: "Quick tour" });

test("a first visit is welcomed, then guided through the first edit", async ({
  page,
}) => {
  await firstVisit(page);
  await expect(welcome(page)).toBeVisible();
  await welcome(page)
    .getByRole("button", { name: /Start from the sample/ })
    .click();

  // Step 1 points at the name, and completes when it changes.
  await expect(tour(page)).toContainText("Step 1 of 3");
  await expect(
    page.locator("[data-page] [data-resume-header] h1 [contenteditable]"),
  ).toHaveAttribute("data-tour-target", "");
  await typeInto(page, nameField(page), "Ada Lovelace");
  await page.keyboard.press("Enter");

  // Step 2 points at the Document tab, and completes on a template change.
  await expect(tour(page)).toContainText("Step 2 of 3");
  await expect(page.locator("[data-tour='document-tab']")).toHaveAttribute(
    "data-tour-target",
    "",
  );
  await chooseTemplate(page, "Banner");

  await expect(tour(page)).toContainText("Step 3 of 3");
  await expect(page.locator("[data-tour='download']")).toHaveAttribute(
    "data-tour-target",
    "",
  );
  await tour(page).getByRole("button", { name: "Done" }).click();
  await expect(tour(page)).toBeHidden();
  await expect(page.locator("[data-tour-target]")).toHaveCount(0);

  // Finished means finished.
  await page.reload();
  await waitForPages(page);
  await expect(welcome(page)).toBeHidden();
  await expect(tour(page)).toBeHidden();
  expect((await saved(page)).state.resumeData.personalInfo.fullName).toBe(
    "Ada Lovelace",
  );
});

test("a blank start empties the content and one undo restores it", async ({
  page,
}) => {
  await firstVisit(page);
  await welcome(page)
    .getByRole("button", { name: /Start with a blank page/ })
    .click();
  const data = (await saved(page)).state.resumeData;
  expect(data.personalInfo.fullName).toBe("");
  expect(data.experience).toEqual([]);
  await expect(page.locator("[data-page]").first()).not.toContainText(
    "John Doe",
  );

  await tour(page).getByRole("button", { name: "Skip tour" }).click();
  await page.getByRole("button", { name: /^Undo/ }).click();
  await expect(nameField(page)).toHaveText("John Doe");
});

test("a returning visitor is not welcomed", async ({ page }) => {
  // A save from before the tour existed, with no tour progress recorded.
  await page.addInitScript((key) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem(
        key,
        JSON.stringify({ version: 4, state: { resumeData: {} } }),
      );
      sessionStorage.setItem("seeded", "1");
    }
  }, STORAGE_KEY);
  await firstVisit(page);
  await expect(welcome(page)).toBeHidden();
  await expect(tour(page)).toBeHidden();
});

test("a skipped tour stays skipped", async ({ page }) => {
  await firstVisit(page);
  await welcome(page)
    .getByRole("button", { name: /Start from the sample/ })
    .click();
  await tour(page).getByRole("button", { name: "Skip the tour" }).click();
  await expect(tour(page)).toBeHidden();
  await page.reload();
  await waitForPages(page);
  await expect(welcome(page)).toBeHidden();
  await expect(tour(page)).toBeHidden();
});

test("a reload mid-tour picks up at the same step", async ({ page }) => {
  await firstVisit(page);
  await welcome(page)
    .getByRole("button", { name: /Start from the sample/ })
    .click();
  await tour(page).getByRole("button", { name: "Skip this step" }).click();
  await expect(tour(page)).toContainText("Step 2 of 3");
  await page.reload();
  await waitForPages(page);
  await expect(tour(page)).toContainText("Step 2 of 3");
});

test("the tour can be replayed from the menu", async ({ page }) => {
  await firstVisit(page);
  await welcome(page)
    .getByRole("button", { name: /Start from the sample/ })
    .click();
  await tour(page).getByRole("button", { name: "Skip tour" }).click();
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("menuitem", { name: "Show the quick tour" }).click();
  await expect(tour(page)).toContainText("Step 1 of 3");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("step 2 points at the design panel button", async ({ page }) => {
    await firstVisit(page);
    await welcome(page)
      .getByRole("button", { name: /Start from the sample/ })
      .click();
    await tour(page).getByRole("button", { name: "Skip this step" }).click();
    await expect(page.locator("[data-tour='design-panel']")).toHaveAttribute(
      "data-tour-target",
      "",
    );
  });
});
