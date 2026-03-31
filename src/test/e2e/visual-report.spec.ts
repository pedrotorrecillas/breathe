import { expect, test } from "@playwright/test";

test.describe("visual regression", () => {
  test("renders the home surface consistently", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("section").first()).toHaveScreenshot(
      "home-surface.png",
    );
  });
});
