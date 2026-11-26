import { test, expect, type Page } from "@playwright/test";

const contactOf = (page: Page) =>
  page.getByRole("region", { name: "What needs a hand?" });

function rowFor(page: Page, name: string) {
  return page.getByRole("listitem").filter({
    has: page.getByRole("button", { name, exact: true }),
  });
}

async function recordDelivery(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { copied: string[]; drafts: string[] };
    w.copied = [];
    w.drafts = [];
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          w.copied.push(text);
        },
      },
    });
    const nav = (
      window as unknown as {
        navigation?: EventTarget;
      }
    ).navigation;
    nav?.addEventListener("navigate", (event) => {
      const e = event as Event & { destination: { url: string } };
      if (e.destination.url.startsWith("mailto:")) {
        w.drafts.push(e.destination.url);
        e.preventDefault();
      }
    });
  });
}

const delivered = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { copied: string[]; drafts: string[] };
    return { copied: w.copied.length, drafts: w.drafts.length };
  });

function luminance([r, g, b]: number[]) {
  const [R, G, B] = [r!, g!, b!].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R! + 0.7152 * G! + 0.0722 * B!;
}

for (const size of [
  { width: 390, height: 844 },
  { width: 1100, height: 800 },
]) {
  test(`contact buttons work at the bottom of a ${size.width}px screen with an estimate`, async ({
    page,
  }) => {
    await recordDelivery(page);
    await page.setViewportSize(size);
    await page.goto("./");
    await rowFor(page, "TV mount")
      .getByRole("button", { name: "Add", exact: true })
      .click();
    const contact = contactOf(page);
    await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");

    for (const [button, kind] of [
      ["Copy request", "copied"],
      ["Open email draft", "drafts"],
    ] as const) {
      const job = contact.getByLabel("What needs doing?", { exact: true });
      await job.fill(`Mount the TV (${kind}).`);
      const target = contact.getByRole("button", { name: button, exact: true });
      const box = (await target.boundingBox())!;
      await page.evaluate(
        (bottom) => window.scrollBy(0, bottom - innerHeight + 6),
        box.y + box.height,
      );
      await job.focus();
      await expect(page.locator("details.estimate-mobile")).toBeHidden();
      const at = (await target.boundingBox())!;
      const before = await delivered(page);
      await page.mouse.click(at.x + at.width / 2, at.y + at.height / 2);
      await expect
        .poll(async () => (await delivered(page))[kind])
        .toBe(before[kind] + 1);
    }
  });
}

test("the open estimate sheet stays on screen at 1024 by 768 with six items", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("./");
  for (const name of [
    "Shiplap accent wall",
    "Floor install — LVP or tile",
    "Ethernet drop",
    "TV mount",
    "Baseboard — new install",
    "Crown molding",
  ])
    await rowFor(page, name)
      .getByRole("button", { name: "Add", exact: true })
      .click();
  const sheet = page.locator("details.estimate-mobile");
  await sheet.locator("summary").click();
  const box = (await sheet.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  await expect(sheet.locator("summary")).toBeInViewport();
});

test("a keyboard-focused active filter keeps readable text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  await page.getByRole("searchbox", { name: "Search services" }).focus();
  await page.keyboard.press("Tab");
  const active = page.getByRole("button", { name: "Everything" });
  await expect(active).toBeFocused();
  const [text, background] = await active.evaluate((el) => {
    const style = getComputedStyle(el);
    const parse = (value: string) =>
      value.match(/[\d.]+/g)!.map(Number) as number[];
    return [parse(style.color), parse(style.backgroundColor)];
  });
  const alpha = background[3] ?? 1;
  const composite = background
    .slice(0, 3)
    .map((channel) => channel * alpha + 255 * (1 - alpha));
  const [light, dark] = [luminance(text), luminance(composite)].sort(
    (a, b) => b - a,
  );
  expect((light! + 0.05) / (dark! + 0.05)).toBeGreaterThanOrEqual(4.5);
});

test("a request never carries a negative, zero or fractional count", async ({
  page,
}) => {
  await recordDelivery(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  await rowFor(page, "Ethernet drop")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  const estimate = page.getByRole("complementary");
  const quantity = estimate.getByRole("spinbutton");
  const contact = contactOf(page);
  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await contact
    .getByLabel("What needs doing?", { exact: true })
    .fill("Two drops.");
  for (const typed of ["-4", "0", "2.5"]) {
    await quantity.fill(typed);
    await estimate.getByRole("link", { name: "Request a walkthrough" }).click();
    await contact
      .getByRole("button", { name: "Copy request", exact: true })
      .click();
    const text = await contact.getByLabel("Your request text").textContent();
    const count = Number(text!.match(/Ethernet drop: (\S+) drop/)![1]);
    expect(Number.isInteger(count) && count >= 1).toBe(true);
    await expect(quantity).toHaveValue(String(count));
  }
});

for (const sourceLink of [
  "footer",
  "catalog citation",
  "detail citation",
] as const) {
  test(`reading a ${sourceLink} preserves the request without browser storage`, async ({
    page,
    context,
  }) => {
    await recordDelivery(page);
    const sent: string[] = [];
    context.on("request", (request) => {
      if (request.method() !== "GET") sent.push(request.url());
    });
    await page.goto("./");
    const originalUrl = page.url();
    const contact = contactOf(page);
    await contact.getByLabel("Name (optional)").fill("Sam");
    await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
    await contact.getByLabel("Town or ZIP (optional)").fill("Westfield");
    await contact
      .getByLabel("What needs doing?", { exact: true })
      .fill("Hang the TV.");
    await rowFor(page, "TV mount")
      .getByRole("button", { name: "Add", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Toilet replacement", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Request a walkthrough" })
      .click();

    if (sourceLink === "detail citation") {
      await page
        .getByRole("button", { name: "Faucet replacement", exact: true })
        .click();
    }
    const link =
      sourceLink === "footer"
        ? page.getByRole("link", {
            name: "How we price (opens in a new tab)",
            exact: true,
          })
        : sourceLink === "catalog citation"
          ? rowFor(page, "Subfloor repair").getByRole("link")
          : page.getByRole("dialog").getByRole("link", { name: /HomeGuide/ });
    const sourceLinks = page.locator('a[href^="sources.html"]');
    for (const source of await sourceLinks.all()) {
      await expect(source).toHaveAttribute("target", "_blank");
      await expect(source).toHaveAttribute("rel", "noopener");
      await expect(source).toHaveAccessibleName(/opens in a new tab/);
    }
    const popupPromise = page.waitForEvent("popup");
    await link.click();
    const sources = await popupPromise;
    await expect(
      sources.getByRole("heading", { name: "Market band sources" }),
    ).toBeVisible();
    const hash =
      sourceLink === "footer"
        ? ""
        : sourceLink === "catalog citation"
          ? "#HomeGuide, 2026 (subfloor)"
          : "#HomeGuide, 2026 (faucet)";
    expect(decodeURIComponent(new URL(sources.url()).hash)).toBe(hash);
    expect(await sources.evaluate(() => window.opener === null)).toBe(true);
    expect(
      await sources.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
        cookies: document.cookie,
      })),
    ).toEqual({ local: 0, session: 0, cookies: "" });
    await sources.close();
    await page.bringToFront();
    if (sourceLink === "detail citation") {
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Close", exact: true })
        .click();
    }
    expect(page.url()).toBe(originalUrl + "#contact");
    await expect(contact.getByLabel("Name (optional)")).toHaveValue("Sam");
    await expect(contact.getByLabel("Email", { exact: true })).toHaveValue(
      "sam@example.com",
    );
    await expect(contact.getByLabel("Town or ZIP (optional)")).toHaveValue(
      "Westfield",
    );
    await expect(
      contact.getByLabel("What needs doing?", { exact: true }),
    ).toHaveValue("Hang the TV.");
    await expect(contact).toContainText(
      "Your request will name the service you were viewing: Toilet replacement.",
    );
    await expect(
      rowFor(page, "TV mount").getByRole("button", {
        name: "Add again",
        exact: true,
      }),
    ).toBeVisible();
    await contact
      .getByRole("button", { name: "Copy request", exact: true })
      .click();
    const text = contact.getByLabel("Your request text");
    await expect(text).toContainText("TV mount");
    await expect(text).toContainText("Toilet replacement");
    expect(
      await page.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
        cookies: document.cookie,
      })),
    ).toEqual({ local: 0, session: 0, cookies: "" });
    expect(await context.cookies()).toEqual([]);
    expect(sent).toEqual([]);
  });
}

test("an hourly price stays on one line on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  const price = rowFor(page, "Hourly work: something not listed").getByText(
    "$85/hr plus materials",
  );
  const box = (await price.boundingBox())!;
  const lineHeight = await price.evaluate((el) =>
    parseFloat(getComputedStyle(el).lineHeight),
  );
  expect(box.height).toBeLessThan(lineHeight * 1.5);
});

for (const width of [1440, 1280, 1000]) {
  test(`catalog heading and filters sit on single lines at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    const tops = await page
      .getByRole("group", { name: "Filter by category" })
      .getByRole("button")
      .evaluateAll((buttons) =>
        buttons.map((b) => Math.round(b.getBoundingClientRect().top)),
      );
    expect(new Set(tops).size).toBe(1);
    const heading = page.getByRole("heading", {
      name: "Small jobs. A real difference.",
    });
    const lineHeight = await heading.evaluate((el) =>
      parseFloat(getComputedStyle(el).lineHeight),
    );
    expect((await heading.boundingBox())!.height).toBeLessThan(
      lineHeight * 1.5,
    );
    const intro = (await page
      .locator(".catalog-heading .intro")
      .boundingBox())!;
    const guide = (await page
      .locator(".catalog-heading details")
      .boundingBox())!;
    expect(Math.abs(guide.y - intro.y)).toBeLessThan(24);
  });
}

test("rows scrolling under the sticky filters are fully covered", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  const marker = rowFor(page, "Smart switch or dimmer swap").locator(
    ".band-marker",
  );
  const start = (await marker.boundingBox())!;
  await page.evaluate((dy) => window.scrollBy(0, dy), start.y - 40);
  const box = (await marker.boundingBox())!;
  const covered = await page.evaluate(
    ([x, y]) => !!document.elementFromPoint(x!, y!)?.closest(".filter-bar"),
    [box.x + 0.5, box.y + box.height / 2],
  );
  expect(covered).toBe(true);
});

for (const width of [390, 768]) {
  test(`the filter bar runs edge to edge at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./");
    const box = (await page.locator(".filter-bar").boundingBox())!;
    expect(box.x).toBe(0);
    expect(box.width).toBe(width);
  });
}

test("price sublines line up with the price on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  const row = rowFor(page, "Shiplap accent wall");
  const price = (await row
    .getByText("$4.75/sq ft", { exact: true })
    .boundingBox())!;
  const minimum = (await row.getByText("80 sq ft minimum").boundingBox())!;
  expect(minimum.x).toBe(price.x);
});

test("requesting a selected service does not restore it after removal", async ({
  page,
}) => {
  await recordDelivery(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  await rowFor(page, "TV mount")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await page.getByRole("button", { name: "TV mount", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Request a walkthrough" })
    .click();
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "Remove" })
    .click();

  const contact = contactOf(page);
  await expect(
    contact.getByText("Your request will name the service"),
  ).toHaveCount(0);
  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await contact
    .getByLabel("What needs doing?", { exact: true })
    .fill("Fix the entry door.");
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  await contact.getByRole("button", { name: "Open email draft" }).click();
  await expect.poll(() => delivered(page)).toEqual({ copied: 1, drafts: 1 });
  const output = await page.evaluate(() => {
    const w = window as unknown as { copied: string[]; drafts: string[] };
    return {
      copy: w.copied[0],
      draft: new URL(w.drafts[0]!).searchParams.get("body"),
    };
  });
  for (const body of [output.copy, output.draft]) {
    expect(body).toContain("Fix the entry door.");
    expect(body).not.toContain("Asked about:");
    expect(body).not.toContain("TV mount");
  }
});

test("a viewed service can be left out and does not return after removal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  const contact = contactOf(page);
  const note = contact.getByText("Your request will name the service");
  const view = async () => {
    await page.getByRole("button", { name: "TV mount", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Request a walkthrough" })
      .click();
  };
  await view();
  await expect(note).toBeVisible();
  await contact.getByRole("button", { name: "Leave TV mount out" }).click();
  await expect(note).toHaveCount(0);

  await view();
  await rowFor(page, "TV mount")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "Remove" })
    .click();
  await expect(note).toHaveCount(0);
});

for (const width of [600, 700, 768, 899, 1000, 1440]) {
  test(`the catalog intro keeps a readable width at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    const intro = (await page
      .locator(".catalog-heading .intro")
      .boundingBox())!;
    expect(intro.width).toBeGreaterThanOrEqual(380);
  });
}

test("chosen add-ons reach the request with their counts", async ({ page }) => {
  await recordDelivery(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  for (const name of ["TV mount", "Floor install — LVP or tile"])
    await rowFor(page, name)
      .getByRole("button", { name: "Add", exact: true })
      .click();
  const estimate = page.getByRole("complementary");
  await estimate.getByLabel("In-wall cable concealment").check();
  await estimate.getByLabel("Transitions and quarter round").check();
  await estimate
    .getByRole("spinbutton", { name: /Transitions and quarter round/ })
    .fill("12");
  const contact = contactOf(page);
  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await contact
    .getByLabel("What needs doing?", { exact: true })
    .fill("TV and a floor.");
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  const text = contact.getByLabel("Your request text");
  await expect(text).toContainText("+ In-wall cable concealment");
  await expect(text).toContainText(
    "+ Transitions and quarter round: 12 linear ft",
  );
  await expect(text).not.toContainText("$");
});

test("the estimate bar shows when the request card is only partly on a tall screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 1366 });
  await page.goto("./");
  const card = (await contactOf(page).boundingBox())!;
  await page.evaluate((y) => window.scrollTo(0, y), card.y + card.height - 30);
  const add = page.getByRole("button", { name: "Add", exact: true }).first();
  await expect(add).toBeInViewport();
  await expect(contactOf(page)).toBeInViewport();
  await add.click();
  await expect(page.locator("details.estimate-mobile")).toBeVisible();
});

test("an open estimate sheet stays open while the request card comes into view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await rowFor(page, "TV mount")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  const sheet = page.locator("details.estimate-mobile");
  await sheet.locator("summary").click();
  await expect(sheet).toHaveAttribute("open", "");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(contactOf(page)).toBeInViewport();
  await page.waitForTimeout(200);
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAttribute("open", "");
});

test("the filter pill focus ring is not clipped", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  await page.getByRole("searchbox", { name: "Search services" }).focus();
  for (const name of ["Everything", "Water & Plumbing"]) {
    await page.keyboard.press("Tab");
    const pill = page.getByRole("button", { name, exact: true });
    await expect(pill).toBeFocused();
    const [inside, ring] = await pill.evaluate((el) => {
      const box = el.parentElement!.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      const ring = parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset);
      return [
        r.top - ring >= box.top &&
          r.left - ring >= box.left &&
          r.bottom + ring <= box.bottom,
        ring,
      ];
    });
    expect(ring).toBeGreaterThan(0);
    expect(inside).toBe(true);
  }
});

for (const width of [1024, 1440]) {
  test(`the filter bar rule lines up with the rows at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    const [left, right] = await page.locator(".filter-bar").evaluate((el) => {
      const r = el.getBoundingClientRect();
      const after = getComputedStyle(el, "::after");
      if (after.content !== "none" && after.borderBottomWidth !== "0px")
        return [
          r.left + parseFloat(after.left),
          r.right - parseFloat(after.right),
        ];
      return [r.left, r.right];
    });
    const row = (await page.locator(".service-row").first().boundingBox())!;
    expect(left).toBe(row.x);
    expect(right).toBe(row.x + row.width);
  });
}

for (const width of [700, 800, 860, 1000, 1440]) {
  test(`the swipe hint shows only when pills overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    const overflows = await page
      .getByRole("group", { name: "Filter by category" })
      .evaluate((el) => el.scrollWidth > el.clientWidth);
    const hint = page.getByText("Swipe for more categories");
    if (overflows) await expect(hint).toBeVisible();
    else await expect(hint).toBeHidden();
  });
}

test("the swipe hint follows the pills once a slow web font arrives", async ({
  page,
}) => {
  await page.route("**/*.woff2", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.setViewportSize({ width: 834, height: 1112 });
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const overflows = await page
    .getByRole("group", { name: "Filter by category" })
    .evaluate((el) => el.scrollWidth > el.clientWidth);
  const hint = page.getByText("Swipe for more categories");
  if (overflows) await expect(hint).toBeVisible();
  else await expect(hint).toBeHidden();
});

test("hiding the sheet by keyboard over the request card keeps the bar and focus", async ({
  page,
  browserName,
}) => {
  const option = browserName === "webkit" ? "Alt+" : "";
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await rowFor(page, "TV mount")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  const sheet = page.locator("details.estimate-mobile");
  const summary = sheet.locator("summary");
  await expect(summary).toBeVisible();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(sheet).toHaveAttribute("open", "");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(contactOf(page)).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(sheet).not.toHaveAttribute("open", "");
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await page.keyboard.press(`${option}Tab`);
  await expect(
    page.getByRole("link", { name: "How we price (opens in a new tab)" }),
  ).toBeFocused();
  await expect(summary).toBeVisible();
  await page.keyboard.press(`${option}Shift+Tab`);
  await expect(summary).toBeFocused();
});

for (const [size, opened] of [
  { width: 390, height: 844 },
  { width: 1100, height: 800 },
].flatMap((size) =>
  (["pointer", "keyboard"] as const).map((opened) => [size, opened] as const),
)) {
  test(`after a ${opened} open and a pointer Hide over the request card every contact button acts at ${size.width}px`, async ({
    page,
  }) => {
    await recordDelivery(page);
    await page
      .context()
      .route(/^https:\/\/(mail\.google\.com|outlook\.live\.com)\//, (route) =>
        route.fulfill({ contentType: "text/html", body: "<!doctype html>" }),
      );
    await page.setViewportSize(size);
    await page.goto("./");
    await rowFor(page, "TV mount")
      .getByRole("button", { name: "Add", exact: true })
      .click();
    const contact = contactOf(page);
    await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
    await contact
      .getByLabel("What needs doing?", { exact: true })
      .fill("Mount the TV.");
    const sheet = page.locator("details.estimate-mobile");
    const summary = sheet.locator("summary");

    for (const [button, kind] of [
      ["Copy request", "copied"],
      ["Open email draft", "drafts"],
      ["Open in Gmail (opens in a new tab)", "webMail"],
      ["Open in Outlook (opens in a new tab)", "webMail"],
    ] as const) {
      await page.locator("#catalog-search").scrollIntoViewIfNeeded();
      await expect(summary).toBeVisible();
      if (opened === "pointer") await summary.click();
      else {
        await summary.focus();
        await page.keyboard.press("Enter");
      }
      await expect(sheet).toHaveAttribute("open", "");
      await page.evaluate(() => window.scrollTo(0, 0));
      await summary.click();
      await expect(sheet).not.toHaveAttribute("open", "");
      const target = contact.getByRole("button", { name: button, exact: true });
      const box = (await target.boundingBox())!;
      await page.evaluate(
        (bottom) => window.scrollBy(0, bottom - innerHeight + 6),
        box.y + box.height,
      );
      await expect(sheet).toBeHidden();
      const at = (await target.boundingBox())!;
      const acted = async () => ({
        ...(await delivered(page)),
        webMail: page.context().pages().length - 1,
      });
      const before = await acted();
      await page.mouse.click(at.x + at.width / 2, at.y + at.height / 2);
      await expect.poll(async () => (await acted())[kind]).toBe(before[kind] + 1);
      await expect(sheet).not.toHaveAttribute("open", "");
      for (const extra of page.context().pages().slice(1)) await extra.close();
    }
  });
}

test("the estimate bar hides when the request card grows under it without a scroll", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => undefined },
    }),
  );
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("./");
  await rowFor(page, "TV mount")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  const contact = contactOf(page);
  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await contact
    .getByLabel("What needs doing?", { exact: true })
    .fill("Mount the TV.");
  await page.locator("#catalog-search").focus();
  const card = (await contact.boundingBox())!;
  await page.evaluate(
    (bottom) => window.scrollBy(0, bottom - (innerHeight - 100)),
    card.y + card.height,
  );
  const bar = page.locator("details.estimate-mobile");
  await expect(bar).toBeVisible();
  const scrolled = await page.evaluate(() => scrollY);
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  await expect(contact.getByLabel("Your request text")).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(scrolled);
  await expect(bar).toBeHidden();
});
