import { expect, test, type Page } from "@playwright/test";
import {
  STORAGE_KEY,
  openBuilder,
  saved,
  waitForPages,
} from "./support/builder";

const POINTS = [
  "Responsible for the billing system",
  "I built a new invoicing API for finance",
  "Cut cloud costs 20% by moving batch jobs to spot instances",
].join("\n");

/** The sample, with its first role's points replaced by `POINTS`. */
async function openWithPoints(page: Page) {
  await openBuilder(page);
  const { state, version } = await saved(page);
  state.resumeData.experience[0].description = POINTS;
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
    STORAGE_KEY,
    JSON.stringify({ version, state }),
  ] as const);
  await page.reload();
  await waitForPages(page);
}

const suggestions = (page: Page) =>
  page.getByRole("list", { name: "Suggestions for these points" });

test("selecting a role reviews its points line by line", async ({ page }) => {
  await openWithPoints(page);
  await page
    .locator("[data-page]")
    .getByText("Senior Software Engineer", { exact: true })
    .last()
    .click();

  const review = suggestions(page);
  await expect(review).toContainText(
    'Point 1: Starts with "Responsible for" — try Led, Ran or Owned.',
  );
  await expect(review).toContainText('Point 2: Drop "I" and "my".');
  // A point with an action verb and a number has nothing to fix.
  await expect(review).not.toContainText("Point 3");
});

test("questions and examples follow the chosen field, and it's remembered", async ({
  page,
}) => {
  await openWithPoints(page);
  await page
    .locator("[data-page]")
    .getByText("Senior Software Engineer", { exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Show questions and examples" })
    .click();
  await expect(
    page.getByText("What did you build, fix, launch or lead?"),
  ).toBeVisible();

  await page.getByLabel("Examples for").selectOption("sales");
  await expect(page.getByText(/Grew 14 key accounts/)).toBeVisible();

  await page.reload();
  await waitForPages(page);
  await page
    .locator("[data-page]")
    .getByText("Senior Software Engineer", { exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Show questions and examples" })
    .click();
  await expect(page.getByLabel("Examples for")).toHaveValue("sales");
});

test("Content mode reviews points as they are typed", async ({ page }) => {
  await openBuilder(page);
  await page.getByRole("button", { name: /Content/ }).click();
  await page.getByRole("button", { name: /^Work Experience/ }).click();
  await page
    .getByRole("button", { name: /Senior Software Engineer/ })
    .first()
    .click();
  const box = page.getByLabel("What you did").first();
  await box.fill("Worked on the mobile app");
  // No blur yet: the suggestion follows the typing.
  await expect(suggestions(page).first()).toContainText(
    'Starts with "Worked on" — try Built, Shipped or Improved.',
  );
  await box.fill("Shipped the mobile app to 40k users in 3 months");
  await expect(suggestions(page)).toHaveCount(0);
});

test("the summary gets a length note", async ({ page }) => {
  await openBuilder(page);
  await page.getByRole("button", { name: /Content/ }).click();
  await expect(page.getByText(/^\d+ words — a good length\.$/)).toBeVisible();
});
