import { test, expect } from "@playwright/test";

test("the sources page keeps its own tab title", async ({ page }) => {
  await page.goto("./sources.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Market band sources",
  );
  await expect(page).toHaveTitle("Market band sources | Kamotec Services");
});

for (const [width, cue] of [
  [390, true],
  [1440, false],
] as const) {
  test(`the link column cue shows only when the table runs off screen at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./sources.html");
    const hint = page.getByText("Swipe for the links");
    if (cue) await expect(hint).toBeVisible();
    else await expect(hint).toBeHidden();
    const scroller = page.locator("table").locator("..");
    expect(
      await scroller.evaluate((el) => el.scrollWidth > el.clientWidth),
    ).toBe(cue);
  });
}

test("a cold load of a citation deep link puts its row at the top", async ({
  page,
}) => {
  const key = "Plumbing By The Book / RateYourPlumber, 2026";
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`./sources.html#${encodeURIComponent(key)}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const [top, bottom, height] = await page
    .locator(`[id="${key}"]`)
    .evaluate((row) => {
      const r = row.getBoundingClientRect();
      return [r.top, r.bottom, innerHeight];
    });
  // Scroll offsets are whole pixels and the row starts on a fraction of one.
  expect(Math.abs(top)).toBeLessThan(0.5);
  expect(bottom).toBeLessThanOrEqual(height);
});
