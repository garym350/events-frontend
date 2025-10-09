import { test, expect } from "@playwright/test";

test.describe("Event detail", () => {
  test("renders details and signup form", async ({ page }) => {
    await page.goto("/"); 

    await page.locator("a[href^='/events/']").first().click();

    // Event content visible
    await expect(page.locator("h1")).toBeVisible();

    // Signup form fields
    await expect(page.locator("input#name")).toBeVisible();
    await expect(page.locator("input#email")).toBeVisible();
  });
});
