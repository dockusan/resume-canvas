import { expect, test, type Page } from "@playwright/test";
import { openBuilder, saved } from "./support/builder";

const POSTING = `Senior Backend Engineer
About the role
We're growing our payments platform.
What you'll do:
- Design and run high-volume services in Go and PostgreSQL
- Mentor engineers and lead code reviews
Requirements
- 5+ years of backend engineering experience
- Strong experience with AWS and Docker
- Experience with Kubernetes in production
Nice to have
- GraphQL APIs
- Experience in fintech or payments`;

async function pastePosting(page: Page) {
  await openBuilder(page);
  await page.getByRole("button", { name: "ATS" }).click();
  await page.getByPlaceholder(/Paste the job posting/).fill(POSTING);
}

const row = (page: Page, group: string, text: string) =>
  page
    .getByRole("list", { name: group })
    .getByRole("listitem")
    .filter({ hasText: text });

test("each requirement is marked shown, partly shown or not shown, with proof", async ({
  page,
}) => {
  await pastePosting(page);
  await expect(page.getByText(/1 of 3\s*must-haves shown/)).toBeVisible();

  const aws = row(page, "Must-haves", "AWS and Docker");
  await expect(aws).toContainText("Shown");
  await expect(aws).toContainText(/In (Skills|Certifications)/);

  const years = row(page, "Must-haves", "5+ years");
  await expect(years).toContainText("Partly shown");
  await expect(years).toContainText(/Your roles span about \d+ years/);
  await expect(years).toContainText("Not mentioned: backend");

  const k8s = row(page, "Must-haves", "Kubernetes");
  await expect(k8s).toContainText("Not shown");

  // The intro under "About the role" asks for nothing.
  for (const group of ["Must-haves", "Nice to have", "What you'd do"])
    await expect(row(page, group, "growing our payments")).toHaveCount(0);
  await expect(row(page, "What you'd do", "code reviews")).toContainText(
    "Mentored junior developers",
  );
});

test("without AI there is no suggestion button", async ({ page }) => {
  await pastePosting(page);
  await expect(
    page.getByRole("button", { name: "Suggest edits from my resume" }),
  ).toHaveCount(0);
});

test("AI edits only reword what's there; one undo reverts an edit", async ({
  page,
}) => {
  await page.route("**/api/ai", (route) =>
    route.fulfill({ json: { enabled: true } }),
  );
  await page.route("**/api/ai/match", async (route) => {
    const body = route.request().postDataJSON() as {
      requirements: { id: string; text: string }[];
      evidence: { id: string; text: string }[];
    };
    const req = (s: string) =>
      body.requirements.find((r) => r.text.includes(s))!.id;
    const line = (s: string) =>
      body.evidence.find((e) => e.text.startsWith(s))!.id;
    await route.fulfill({
      json: {
        suggestions: [
          {
            requirementId: req("5+ years"),
            evidenceId: line("Led the migration"),
            revised:
              "Led the backend migration of a legacy monolith to a microservices architecture",
            why: "Migrating the monolith is backend work.",
            question: "",
          },
          {
            // Invents a figure: must never be offered.
            requirementId: req("GraphQL"),
            evidenceId: line("Developed and maintained"),
            revised: "Built GraphQL APIs serving 2M requests a day",
            why: "",
            question: "",
          },
          {
            requirementId: req("Kubernetes"),
            evidenceId: "",
            revised: "",
            why: "",
            question: "Have you run Kubernetes in production? If so, where?",
          },
        ],
      },
    });
  });

  await pastePosting(page);
  await page
    .getByRole("button", { name: "Suggest edits from my resume" })
    .click();
  const list = page.getByRole("list", { name: "Suggested edits" });
  await expect(list).toContainText("Led the backend migration");
  await expect(list).toContainText("Have you run Kubernetes in production?");
  await expect(list).not.toContainText("2M");

  await list.getByRole("button", { name: "Use this wording" }).click();
  expect(
    (await saved(page)).state.resumeData.experience[0].description,
  ).toContain(
    "Led the backend migration of a legacy monolith to a microservices architecture",
  );
  // The requirement now has its word.
  await expect(row(page, "Must-haves", "5+ years")).not.toContainText(
    "Not mentioned: backend",
  );

  await page.getByRole("button", { name: /^Undo/ }).click();
  expect(
    (await saved(page)).state.resumeData.experience[0].description,
  ).toContain("Led the migration of legacy monolith");
});
