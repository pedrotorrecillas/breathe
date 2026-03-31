import { expect, test } from "@playwright/test";

test.describe("public apply flow", () => {
  test("shows the active job page and blocks invalid public links", async ({
    page,
  }) => {
    await page.goto("/apply/demo-warehouse-associate");

    await expect(
      page.getByRole("heading", { name: /Apply to Warehouse Associate/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Submit and receive call/i })).toBeVisible();

    await page.goto("/apply/missing-job-link");

    await expect(page.getByText(/This job link is no longer available/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Submit and receive call/i }),
    ).toHaveCount(0);
  });

  test("blocks inactive and limit-reached jobs before the form is rendered", async ({
    page,
  }) => {
    await page.goto("/apply/demo-retail-shift-lead");

    await expect(
      page.getByText(/This job is no longer accepting applications/i),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Submit and receive call/i })).toHaveCount(0);

    await page.goto("/apply/demo-operations-coordinator");

    await expect(page.getByText(/This job has reached its interview limit/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Submit and receive call/i })).toHaveCount(0);
  });

  test("shows validation and upload failures on the form", async ({ page }) => {
    await page.goto("/apply/demo-warehouse-associate");

    await page.getByRole("button", { name: /Submit and receive call/i }).click();

    await expect(page.getByText(/Full name is required/i)).toBeVisible();
    await expect(page.getByText(/Phone is required/i)).toBeVisible();
    await expect(
      page.getByText(/Provide either a CV upload or a LinkedIn URL/i),
    ).toBeVisible();
    await expect(
      page.getByText(/Candidates must accept the terms before submission/i),
    ).toBeVisible();

    await page.getByLabel("Full name").fill("Lucia Torres");
    await page.getByLabel("Phone").fill("+34 600 123 456");
    await page.getByLabel("CV upload").setInputFiles({
      name: "profile.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });
    await page.getByLabel("Accept terms and AI disclosure").check();
    await page.getByRole("button", { name: /Submit and receive call/i }).click();

    await expect(
      page.getByText(/CV upload failed. Use a PDF, DOC, or DOCX file/i),
    ).toBeVisible();
  });

  test("submits a valid application and shows the interview handoff confirmation", async ({
    page,
  }) => {
    await page.goto("/apply/demo-warehouse-associate");

    await page.getByLabel("Full name").fill("Lucia Torres");
    await page.getByLabel("Phone").fill("+34 600 123 456");
    await page.getByLabel("Email").fill("lucia@example.com");
    await page.getByLabel("LinkedIn URL").fill("http://linkedin.com/in/Lucia-Torres");
    await page.getByLabel("Accept terms and AI disclosure").check();
    await page.getByRole("button", { name: /Submit and receive call/i }).click();

    await expect(page.getByText(/Application received/i)).toBeVisible();
    await expect(page.getByText(/Clara will call you shortly/i)).toBeVisible();
    await expect(
      page.getByText(/The first interview call will use \+34 600 123 456/i),
    ).toBeVisible();
    await expect(
      page.getByText(/We will also keep lucia@example.com available for recruiter follow-up/i),
    ).toBeVisible();
  });
});
