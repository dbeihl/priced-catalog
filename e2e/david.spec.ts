import { test, expect } from "@playwright/test";

test("David prices a toilet swap in the running estimate", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("searchbox", { name: "Search services" }).fill("toilet");
  await expect(page.getByText("2 of 38 services")).toBeVisible();

  const row = page.getByRole("listitem").filter({ has: page.getByRole("button", { name: "Toilet replacement" }) });
  await row.getByRole("button", { name: "Add" }).click();

  const estimate = page.getByRole("complementary");
  await expect(estimate.getByRole("listitem")).toHaveText(/Toilet replacement\s*\$185/);
  await expect(estimate.getByRole("definition").nth(1)).toHaveText("$185");
  await expect(estimate.getByText(/^\$15 . \$40$/)).toBeVisible();

  await estimate.getByRole("button", { name: "Remove" }).click();
  await expect(estimate.getByRole("listitem")).toHaveCount(0);
});
