import { test, expect, type Locator, type Page } from "@playwright/test";

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

// Out of the way means the closed bar neither shows nor catches a press.
const barState = (bar: Locator) =>
  bar.evaluate((el) => {
    const style = getComputedStyle(el);
    return style.display === "none" ||
      (style.opacity === "0" && style.pointerEvents === "none")
      ? "out of the way"
      : "shown";
  });
const expectBar = (bar: Locator, state: "shown" | "out of the way") =>
  expect.poll(() => barState(bar)).toBe(state);

// Playwright WebKit follows macOS: plain Tab skips buttons and links.
const tabKey = (browserName: string, shift = false) =>
  `${browserName === "webkit" ? "Alt+" : ""}${shift ? "Shift+" : ""}Tab`;

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
      await expectBar(page.locator("details.estimate-mobile"), "out of the way");
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
  browserName,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  await page.getByRole("searchbox", { name: "Search services" }).focus();
  await page.keyboard.press(tabKey(browserName));
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
  await expectBar(page.locator("details.estimate-mobile"), "shown");
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
  await expectBar(sheet, "shown");
  await expect(sheet).toHaveAttribute("open", "");
});

test("the filter pill focus ring is not clipped", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  await page.getByRole("searchbox", { name: "Search services" }).focus();
  for (const name of ["Everything", "Water & Plumbing"]) {
    await page.keyboard.press(tabKey(browserName));
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
  await expectBar(sheet, "shown");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(sheet).toHaveAttribute("open", "");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(contactOf(page)).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(sheet).not.toHaveAttribute("open", "");
  await expectBar(sheet, "shown");
  await expect(summary).toBeFocused();
  await page.keyboard.press(`${option}Tab`);
  await expect(
    page.getByRole("link", { name: "How we price (opens in a new tab)" }),
  ).toBeFocused();
  await expectBar(sheet, "shown");
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
      await expectBar(sheet, "shown");
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
      await expectBar(sheet, "out of the way");
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

test("a pointer open keeps focus on the bar so the keyboard can follow into the sheet", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await rowFor(page, "Ethernet drop")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  const sheet = page.locator("details.estimate-mobile");
  const summary = sheet.locator("summary");
  await summary.click();
  await expect(sheet).toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  const scrolled = await page.evaluate(() => scrollY);
  await page.keyboard.press("Tab");
  await expect(sheet.getByRole("spinbutton")).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(scrolled);
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  await expect(sheet).not.toHaveAttribute("open", "");
});

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
  await expectBar(bar, "shown");
  const scrolled = await page.evaluate(() => scrollY);
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  await expect(contact.getByLabel("Your request text")).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(scrolled);
  await expectBar(bar, "out of the way");
});

async function barAwayFromCard(page: Page, service: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await rowFor(page, service)
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await page.evaluate(() => window.scrollBy(0, 3000));
  const sheet = page.locator("details.estimate-mobile");
  await expectBar(sheet, "shown");
  await expect(contactOf(page)).not.toBeInViewport();
  return { sheet, summary: sheet.locator("summary") };
}

for (const gesture of ["right-click", "middle-click", "press-drag-release"]) {
  test(`a ${gesture} on the closed estimate bar leaves the contact buttons clickable`, async ({
    page,
  }) => {
    await recordDelivery(page);
    const { sheet, summary } = await barAwayFromCard(page, "TV mount");
    const contact = contactOf(page);
    await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
    await contact
      .getByLabel("What needs doing?", { exact: true })
      .fill("Mount the TV.");
    await page.evaluate(() => window.scrollBy(0, 3000));
    const bar = (await summary.boundingBox())!;
    const [x, y] = [bar.x + bar.width / 2, bar.y + bar.height / 2];
    if (gesture === "press-drag-release") {
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y - 200, { steps: 5 });
      await page.mouse.up();
    } else {
      await page.mouse.click(x, y, {
        button: gesture === "right-click" ? "right" : "middle",
      });
    }
    await expect(sheet).not.toHaveAttribute("open", "");
    const target = contact.getByRole("button", {
      name: "Copy request",
      exact: true,
    });
    const box = (await target.boundingBox())!;
    await page.evaluate(
      (bottom) => window.scrollBy(0, bottom - innerHeight + 6),
      box.y + box.height,
    );
    await expectBar(sheet, "out of the way");
    const at = (await target.boundingBox())!;
    await page.mouse.click(at.x + at.width / 2, at.y + at.height / 2);
    await expect.poll(async () => (await delivered(page)).copied).toBe(1);
    await expect(sheet).not.toHaveAttribute("open", "");
  });
}

test("after a pointer Hide, Space and Enter reopen the estimate sheet", async ({
  page,
}) => {
  const { sheet, summary } = await barAwayFromCard(page, "Ethernet drop");
  for (const key of ["Space", "Enter"]) {
    await summary.click();
    await expect(sheet).toHaveAttribute("open", "");
    await summary.click();
    await expect(sheet).not.toHaveAttribute("open", "");
    await expectBar(sheet, "shown");
    await page.keyboard.press(key);
    await expect(sheet).toHaveAttribute("open", "");
    await summary.click();
  }
});

test("after a pointer Hide the next Tab carries on from the estimate bar", async ({
  page,
  browserName,
}) => {
  const { sheet, summary } = await barAwayFromCard(page, "Ethernet drop");
  await summary.click();
  await summary.click();
  await expect(sheet).not.toHaveAttribute("open", "");
  await page.keyboard.press(tabKey(browserName));
  await expect(
    page.getByRole("link", { name: "How we price (opens in a new tab)" }),
  ).toBeFocused();
  await expect(contactOf(page)).not.toBeInViewport();
});

for (const [name, note] of [
  [
    "Subfloor repair",
    "Most per-room repairs land here. Severely damaged areas run far above it.",
  ],
  [
    "New fixture location or box replacement",
    "Swapping a non-rated box for a fan-rated one runs $50–$150 when the attic is accessible. New locations in a finished ceiling run well above that.",
  ],
]) {
  test(`the quote-only ${name} detail prints its market band note`, async ({
    page,
  }) => {
    await page.goto("./");
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText(note);
  });
}

async function openEstimate(page: Page) {
  if (page.viewportSize()!.width >= 1200) return page.locator("aside");
  const sheet = page.locator("details.estimate-mobile");
  if (!(await sheet.evaluate((d) => (d as HTMLDetailsElement).open)))
    await sheet.locator("summary").click();
  return sheet;
}

test("a cleared quantity takes the next digit typed without a leading zero", async ({
  page,
}) => {
  await page.goto("./");
  await rowFor(page, "Ethernet drop")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  const quantity = (await openEstimate(page)).getByRole("spinbutton");
  await quantity.click();
  await quantity.press("ControlOrMeta+a");
  await quantity.press("Backspace");
  await quantity.pressSequentially("5");
  await expect(quantity).toHaveValue("5");
  await quantity.blur();
  await expect(quantity).toHaveValue("5");
  await quantity.fill("");
  await quantity.blur();
  await expect(quantity).toHaveValue("1");
});

test("a ticked add-on quantity shows its unit", async ({ page }) => {
  await page.goto("./");
  await rowFor(page, "Floor install — LVP or tile")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  const estimate = await openEstimate(page);
  const transitions = estimate.getByRole("checkbox", {
    name: "Transitions and quarter round",
  });
  await transitions.check();
  const row = estimate.getByRole("listitem").filter({
    has: page.getByRole("spinbutton", {
      name: "Transitions and quarter round, linear ft",
    }),
  }).last();
  await expect(row.getByText("linear ft", { exact: true })).toBeVisible();
});

test("tabbing through the catalog never leaves focus under the estimate bar", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await rowFor(page, "TV mount")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await page.locator("#catalog-search").focus();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press(tabKey(browserName));
    const covered = await page.evaluate(() => {
      const focused = document.activeElement!;
      const bar = document.querySelector("details.estimate-mobile")!;
      if (bar.contains(focused) || !bar.checkVisibility()) return null;
      const own = focused.getBoundingClientRect();
      return own.bottom > bar.getBoundingClientRect().top + 0.5
        ? focused.textContent
        : null;
    });
    expect(covered).toBeNull();
  }
});

test("shift-tabbing up the catalog never leaves focus under the sticky filters", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./");
  await page.getByRole("button", { name: "Add", exact: true }).last().focus();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press(tabKey(browserName, true));
    const covered = await page.evaluate(() => {
      const focused = document.activeElement!;
      const filters = document.querySelector(".filter-bar")!;
      const catalog = document.querySelector("#catalog ul")!;
      if (!catalog.contains(focused)) return null;
      const own = focused.getBoundingClientRect();
      return own.top < filters.getBoundingClientRect().bottom - 0.5
        ? focused.textContent
        : null;
    });
    expect(covered).toBeNull();
  }
});

test("a long desktop estimate scrolls by wheel over its list to reach the request link", async ({
  page,
  browserName,
  isMobile,
}) => {
  test.skip(browserName === "webkit" && isMobile, "mobile WebKit has no wheel");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  for (const name of [
    "Ethernet drop",
    "TV mount",
    "Floor install — LVP or tile",
    "Toilet replacement",
    "Smart switch or dimmer swap",
    "Baseboard — new install",
    "Crown molding",
    "Garbage disposal replacement",
  ])
    await rowFor(page, name)
      .getByRole("button", { name: "Add", exact: true })
      .click();
  await page.evaluate(() => window.scrollBy(0, 2500));
  const rail = page.locator("aside > div");
  const railBox = (await rail.boundingBox())!;
  expect(railBox.y).toBeGreaterThanOrEqual(0);
  expect(railBox.y + railBox.height).toBeLessThanOrEqual(900);
  const line = (await rail.getByRole("listitem").nth(2).boundingBox())!;
  await page.mouse.move(line.x + line.width / 2, line.y + line.height / 2);
  for (let tick = 0; tick < 20; tick++) await page.mouse.wheel(0, 120);
  await expect
    .poll(() =>
      rail.evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 1),
    )
    .toBe(true);
  await expect(
    rail.getByRole("link", { name: "Request a walkthrough" }),
  ).toBeInViewport({ ratio: 1 });
});


for (const key of ["Escape", "ArrowDown", "Shift"]) {
  test(`after a pointer open and Hide, pressing ${key} leaves the bar out of the way of the contact buttons`, async ({
    page,
  }) => {
    await recordDelivery(page);
    const { sheet, summary } = await barAwayFromCard(page, "TV mount");
    const contact = contactOf(page);
    await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
    await contact
      .getByLabel("What needs doing?", { exact: true })
      .fill("Mount the TV.");
    await page.evaluate(() => window.scrollBy(0, 3000));
    await summary.click();
    await expect(sheet).toHaveAttribute("open", "");
    await summary.click();
    await expect(sheet).not.toHaveAttribute("open", "");
    await page.keyboard.press(key);
    const target = contact.getByRole("button", {
      name: "Copy request",
      exact: true,
    });
    const box = (await target.boundingBox())!;
    await page.evaluate(
      (bottom) => window.scrollBy(0, bottom - innerHeight + 6),
      box.y + box.height,
    );
    await expectBar(sheet, "out of the way");
    const at = (await target.boundingBox())!;
    await page.mouse.click(at.x + at.width / 2, at.y + at.height / 2);
    await expect.poll(async () => (await delivered(page)).copied).toBe(1);
    await expect(sheet).not.toHaveAttribute("open", "");
  });
}

test("removing the last item by keyboard does not hold the next estimate bar over the contact buttons", async ({
  page,
}) => {
  await recordDelivery(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await rowFor(page, "TV mount")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  const sheet = page.locator("details.estimate-mobile");
  await sheet.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(sheet).toHaveAttribute("open", "");
  await sheet.getByRole("button", { name: "Remove" }).focus();
  await page.keyboard.press("Enter");
  await expect(sheet).toHaveCount(0);
  const contact = contactOf(page);
  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await contact
    .getByLabel("What needs doing?", { exact: true })
    .fill("Run a cable.");
  await rowFor(page, "Ethernet drop")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  const target = contact.getByRole("button", {
    name: "Copy request",
    exact: true,
  });
  const box = (await target.boundingBox())!;
  await page.evaluate(
    (bottom) => window.scrollBy(0, bottom - innerHeight + 6),
    box.y + box.height,
  );
  await expectBar(sheet, "out of the way");
  const at = (await target.boundingBox())!;
  await page.mouse.click(at.x + at.width / 2, at.y + at.height / 2);
  await expect.poll(async () => (await delivered(page)).copied).toBe(1);
});

test("pressing a keyboard-held bar over the request card opens the sheet", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await rowFor(page, "TV mount")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  const sheet = page.locator("details.estimate-mobile");
  const summary = sheet.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(sheet).toHaveAttribute("open", "");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(contactOf(page)).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(sheet).not.toHaveAttribute("open", "");
  await expectBar(sheet, "shown");
  await summary.click();
  await expect(sheet).toHaveAttribute("open", "");
  await expectBar(sheet, "shown");
});

test("after a pointer Hide over the request card the keyboard keeps its place on the bar", async ({
  page,
  browserName,
}) => {
  const { sheet, summary } = await barAwayFromCard(page, "Ethernet drop");
  await summary.click();
  await expect(sheet).toHaveAttribute("open", "");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(contactOf(page)).toBeInViewport();
  await summary.click();
  await expect(sheet).not.toHaveAttribute("open", "");
  await expectBar(sheet, "out of the way");
  await expect(summary).toBeFocused();
  await page.keyboard.press("Space");
  await expect(sheet).toHaveAttribute("open", "");
  await expectBar(sheet, "shown");
  await summary.click();
  await expect(sheet).not.toHaveAttribute("open", "");
  await page.keyboard.press("Enter");
  await expect(sheet).toHaveAttribute("open", "");
  await summary.click();
  await expect(sheet).not.toHaveAttribute("open", "");
  await page.keyboard.press(tabKey(browserName));
  await expect(
    page.getByRole("link", { name: "How we price (opens in a new tab)" }),
  ).toBeFocused();
});

test("an add-on unit stays beside its quantity at 320 wide", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("./");
  await rowFor(page, "Floor install — LVP or tile")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  const estimate = await openEstimate(page);
  await estimate
    .getByRole("checkbox", { name: "Transitions and quarter round" })
    .check();
  const quantityName = "Transitions and quarter round, linear ft";
  const input = estimate.getByRole("spinbutton", { name: quantityName });
  const unit = estimate
    .getByRole("listitem")
    .filter({ has: page.getByRole("spinbutton", { name: quantityName }) })
    .last()
    .getByText("linear ft", { exact: true });
  const [box, label] = [(await input.boundingBox())!, (await unit.boundingBox())!];
  expect(label.x).toBeGreaterThan(box.x + box.width);
  expect(label.y + label.height / 2).toBeGreaterThan(box.y);
  expect(label.y + label.height / 2).toBeLessThan(box.y + box.height);
});
