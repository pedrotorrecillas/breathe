import { expect, test } from "@playwright/test";

test.describe("public apply flow", () => {
  test("shows the active job page and blocks invalid public links", async ({
    page,
  }) => {
    await page.goto("/apply/demo-warehouse-associate");

    await expect(
      page.getByRole("heading", { name: /Apply for Warehouse Associate/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Send application/i })).toBeVisible();

    await page.goto("/apply/missing-job-link");

    await expect(page.getByText(/This role link is no longer available/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Send application/i }),
    ).toHaveCount(0);
  });

  test("blocks inactive and limit-reached jobs before the form is rendered", async ({
    page,
  }) => {
    await page.goto("/apply/demo-retail-shift-lead");

    await expect(
      page.getByText(/This job is no longer accepting applications/i),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Send application/i })).toHaveCount(0);

    await page.goto("/apply/demo-operations-coordinator");

    await expect(page.getByText(/This job has reached its interview limit/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Send application/i })).toHaveCount(0);
  });

  test("renders the application form shell on the active job page", async ({
    page,
  }) => {
    await page.goto("/apply/demo-warehouse-associate");

    await expect(
      page.getByRole("button", { name: /Send application/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Phone")).toBeVisible();
    await expect(page.getByLabel("LinkedIn URL")).toBeVisible();
    await expect(page.getByLabel("CV upload")).toBeVisible();
  });

});
