import { test, expect, type Page } from "@playwright/test";

const webMail = [
  {
    name: "Gmail",
    prefix: "https://mail.google.com/mail/?view=cm&",
    to: "to",
    subject: "su",
  },
  {
    name: "Outlook",
    prefix: "https://outlook.live.com/mail/0/deeplink/compose?",
    to: "to",
    subject: "subject",
  },
] as const;

async function stubWebMail(page: Page) {
  await page
    .context()
    .route(/^https:\/\/(mail\.google\.com|outlook\.live\.com)\//, (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Web mail stand-in</title>",
      }),
    );
}

const webMailButton = (page: Page, name: string) =>
  page
    .getByRole("region", { name: "What needs a hand?" })
    .getByRole("button", {
      name: `Open in ${name} (opens in a new tab)`,
      exact: true,
    });

const phoneAgents = [
  [
    "iPhone",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  ],
  [
    "iPod",
    "Mozilla/5.0 (iPod touch; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  ],
  [
    "Android phone",
    "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  ],
] as const;

async function blockExternalRequests(page: Page) {
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).origin === "http://localhost:4173") {
      return route.continue();
    }
    return route.abort();
  });
}

async function setUserAgent(page: Page, userAgent: string) {
  await page.addInitScript((agent) => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: agent,
    });
  }, userAgent);
}

for (const [device, userAgent] of phoneAgents) {
  test(`${device} visitors can copy the email address without filling the form`, async ({
    page,
  }) => {
    await blockExternalRequests(page);
    await setUserAgent(page, userAgent);
    await page.addInitScript(() => {
      (window as unknown as { copied: string[] }).copied = [];
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async (text: string) => {
            (window as unknown as { copied: string[] }).copied.push(text);
          },
        },
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./");
    const contact = page.getByRole("region", { name: "What needs a hand?" });
    const actions = contact.locator(".contact-actions");
    await expect(actions.getByRole("button")).toHaveText([
      "Open email draft ↗",
      "Copy email address",
      "Copy request",
    ]);
    await expect(page.locator("body")).not.toContainText(/Gmail|Outlook/);
    await actions
      .getByRole("button", { name: "Copy email address", exact: true })
      .click();
    await expect(contact.getByRole("status")).toContainText(
      "Email address copied",
    );
    expect(
      await page.evaluate(() => (window as unknown as { copied: string[] }).copied),
    ).toEqual(["info@kamotec.io"]);
    await expect(contact.getByLabel("Email", { exact: true })).toHaveValue("");
    await expect(
      contact.getByLabel("What needs doing?", { exact: true }),
    ).toHaveValue("");
  });
}

test("phone address-copy failure leaves the address visible and selectable", async ({
  page,
}) => {
  await blockExternalRequests(page);
  await setUserAgent(page, phoneAgents[0][1]);
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Clipboard denied");
        },
      },
    }),
  );
  await page.goto("./");
  const contact = page.getByRole("region", { name: "What needs a hand?" });
  await contact
    .getByRole("button", { name: "Copy email address", exact: true })
    .click();
  await expect(contact.getByRole("status")).toContainText(
    "Select and copy the email address below",
  );
  const address = contact.getByRole("link", { name: "info@kamotec.io" });
  await expect(address).toBeVisible();
  expect(
    await address.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return selection?.toString();
    }),
  ).toBe("info@kamotec.io");
});

for (const [device, userAgent, width] of [
  [
    "iPad",
    "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Safari/604.1",
    1024,
  ],
  [
    "Android tablet",
    "Mozilla/5.0 (Linux; Android 14; SM-X900) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
    1024,
  ],
  [
    "narrow desktop",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
    320,
  ],
] as const) {
  test(`${device} keeps the Gmail and Outlook web buttons`, async ({ page }) => {
    await blockExternalRequests(page);
    await setUserAgent(page, userAgent);
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./");
    const contact = page.getByRole("region", { name: "What needs a hand?" });
    await expect(contact.getByRole("button")).toHaveText([
      "Open email draft ↗",
      "Open in Gmail (opens in a new tab) ↗",
      "Open in Outlook (opens in a new tab) ↗",
      "Copy request",
    ]);
    await expect(contact).toContainText("Opens a draft in your email app, Gmail or Outlook.");
    await expect(
      contact.getByRole("button", { name: "Copy email address", exact: true }),
    ).toHaveCount(0);
  });
}

test("visitor can prepare and copy a walkthrough before browsing services", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
    });
  });
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") submissions.push(request.url());
  });
  await page.goto("./");
  const contact = page.getByRole("region", { name: "What needs a hand?" });
  await expect(contact.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(
    contact.getByLabel("What needs doing?", { exact: true }),
  ).toBeVisible();
  const contactBox = await contact.boundingBox();
  const catalogBox = await page
    .getByRole("heading", { name: "Small jobs. A real difference." })
    .boundingBox();
  expect(contactBox!.y).toBeLessThan(catalogBox!.y);
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  await expect(contact.getByLabel("Email", { exact: true })).toBeFocused();
  await contact.getByLabel("Name (optional)").fill("Sam");
  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await contact.getByLabel("Town or ZIP (optional)").fill("Westfield");
  await contact
    .getByLabel("What needs doing?", { exact: true })
    .fill("Fix the entry door & trim.");
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  await expect(contact.getByRole("status")).toContainText("Request copied");
  const copied = await page.evaluate(
    () => (window as unknown as { copied: string }).copied,
  );
  expect(copied).toContain("Reply email: sam@example.com");
  expect(copied).toContain("Fix the entry door & trim.");
  await expect(
    contact.getByLabel("What needs doing?", { exact: true }),
  ).toHaveValue("Fix the entry door & trim.");
  expect(submissions).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookies: document.cookie,
    })),
  ).toEqual({ local: 0, session: 0, cookies: "" });
});

test("clipboard failure retains the current estimate and editable request", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Clipboard denied");
        },
      },
    }),
  );
  await page.goto("./");
  const contact = page.getByRole("region", { name: "What needs a hand?" });
  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await contact
    .getByLabel("What needs doing?", { exact: true })
    .fill("Replace the trim.");
  await page
    .getByRole("searchbox", { name: "Search services" })
    .fill("baseboard");
  const row = page.getByRole("listitem").filter({
    has: page.getByRole("button", {
      name: "Baseboard — new install",
      exact: true,
    }),
  });
  await row.getByRole("button", { name: "Add", exact: true }).click();
  const mobile = (page.viewportSize()?.width ?? 1440) < 1200;
  const estimate = mobile
    ? page.locator("details.estimate-mobile")
    : page.getByRole("complementary");
  if (mobile) await estimate.locator("summary").click();
  await estimate.getByRole("spinbutton").fill("120");
  await estimate.getByRole("link", { name: "Request a walkthrough" }).click();
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  await expect(contact.getByRole("status")).toContainText(
    "Copy was unavailable",
  );
  await expect(contact.getByLabel("Your request text")).toContainText(
    "Baseboard — new install: 120 linear ft",
  );
  await expect(contact.getByLabel("Your request text")).not.toContainText("$");
  await expect(
    contact.getByLabel("What needs doing?", { exact: true }),
  ).toHaveValue("Replace the trim.");
  if (mobile) {
    await page
      .getByRole("searchbox", { name: "Search services" })
      .scrollIntoViewIfNeeded();
    await estimate.locator("summary").click();
  }
  await estimate.getByRole("spinbutton").fill("240");
  await estimate.getByRole("link", { name: "Request a walkthrough" }).click();
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  await expect(contact.getByLabel("Your request text")).toContainText(
    "240 linear ft",
  );
  if (mobile) {
    await page
      .getByRole("searchbox", { name: "Search services" })
      .scrollIntoViewIfNeeded();
    await estimate.locator("summary").click();
  }
  await estimate.getByRole("button", { name: "Remove" }).click();
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  await expect(contact.getByLabel("Your request text")).not.toContainText(
    "Baseboard",
  );
});

test("long drafts use selectable text and whitespace-only jobs remain invalid", async ({
  page,
}) => {
  await page.goto("./");
  const contact = page.getByRole("region", { name: "What needs a hand?" });
  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  const message = contact.getByLabel("What needs doing?", { exact: true });
  await message.fill("   ");
  await contact
    .getByRole("button", { name: "Open email draft", exact: true })
    .click();
  await expect(message).toBeFocused();
  await expect(contact.getByRole("status")).toBeEmpty();
  await message.fill("A repair detail. ".repeat(200));
  await contact
    .getByRole("button", { name: "Open email draft", exact: true })
    .click();
  await expect(contact.getByRole("status")).toContainText(
    "too long for a reliable email link",
  );
  await expect(contact.getByLabel("Your request text")).toContainText(
    "A repair detail.",
  );
  expect(page.url()).not.toContain("mailto:");
});

test("mobile contact stays above the catalog without document overflow", async ({
  page,
}) => {
  for (const width of [320, 390, 1280, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const heading = await page
      .getByRole("heading", { name: "What needs a hand?" })
      .boundingBox();
    const email = await page.getByLabel("Email", { exact: true }).boundingBox();
    expect(heading!.y).toBeLessThan(844);
    expect(email!.y + email!.height).toBeLessThan(844);
    if (width === 390) {
      const action = await page
        .getByRole("button", { name: "Open email draft", exact: true })
        .boundingBox();
      expect(action!.y + action!.height).toBeLessThan(844);
    }
  }
});

test("details return to contact and sources remain navigable", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Toilet replacement", exact: true })
    .click();
  const detail = page.getByRole("dialog");
  await expect(
    detail.getByRole("heading", { name: "Toilet replacement" }),
  ).toBeVisible();
  await expect(detail.locator("header")).toContainText("$185");
  await detail.getByRole("link", { name: "Request a walkthrough" }).click();
  await expect(detail).not.toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeInViewport();
  const popupPromise = page.waitForEvent("popup");
  await page
    .getByRole("link", {
      name: "How we price (opens in a new tab)",
      exact: true,
    })
    .click();
  const sources = await popupPromise;
  await expect(
    sources.getByRole("heading", { name: "Market band sources" }),
  ).toBeVisible();
  expect(sources.url()).toContain("/priced-catalog/sources.html");
  await sources.close();
});

test("a viewed service joins the request without changing job text or the estimate", async ({
  page,
}) => {
  await page.goto("./");
  const contact = page.getByRole("region", { name: "What needs a hand?" });
  const message = contact.getByLabel("What needs doing?", { exact: true });
  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await message.fill("Bathroom is leaking.");
  await page
    .getByRole("button", { name: "Toilet replacement", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Request a walkthrough" })
    .click();
  await expect(message).toHaveValue("Bathroom is leaking.");
  await expect(page.getByRole("button", { name: "Remove" })).toHaveCount(0);
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  const text = contact.getByLabel("Your request text");
  await expect(text).toContainText("Bathroom is leaking.");
  await expect(text).toContainText("Asked about: Toilet replacement");
  await expect(text).not.toContainText("Selected services");

  const row = page.getByRole("listitem").filter({
    has: page.getByRole("button", {
      name: "Toilet replacement",
      exact: true,
    }),
  });
  await row.getByRole("button", { name: "Add", exact: true }).click();
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  await expect(text).not.toContainText("Asked about");
  await expect(text).toContainText("- Toilet replacement");
  expect(
    (await text.textContent())!.split("Toilet replacement").length - 1,
  ).toBe(1);
});

test("copied feedback clears when the estimate changes the request", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => undefined },
    }),
  );
  await page.goto("./");
  const contact = page.getByRole("region", { name: "What needs a hand?" });
  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await contact
    .getByLabel("What needs doing?", { exact: true })
    .fill("Replace the trim.");
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  await expect(contact.getByRole("status")).toContainText("Request copied");
  const row = page.getByRole("listitem").filter({
    has: page.getByRole("button", { name: "TV mount", exact: true }),
  });
  await row.getByRole("button", { name: "Add", exact: true }).click();
  await expect(contact.getByRole("status")).toBeEmpty();
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  await expect(contact.getByRole("status")).toContainText("Request copied");
  await expect(contact.getByLabel("Your request text")).toContainText(
    "- TV mount",
  );
});

test("desktop request form is one wide card with the job box beside the details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  const contact = page.getByRole("region", { name: "What needs a hand?" });
  const card = (await contact.boundingBox())!;
  const email = (await contact
    .getByLabel("Email", { exact: true })
    .boundingBox())!;
  const job = (await contact
    .getByLabel("What needs doing?", { exact: true })
    .boundingBox())!;
  const action = (await contact
    .getByRole("button", { name: "Open email draft", exact: true })
    .boundingBox())!;
  expect(card.width).toBeGreaterThan(1000);
  expect(job.x).toBeGreaterThan(email.x + email.width);
  expect(action.y + action.height).toBeLessThan(card.y + card.height);
});

test("recent work photos load with plain captions and no prices", async ({
  page,
}) => {
  await page.goto("./");
  const photos = page.locator("figure:has(img)");
  await expect(photos).toHaveCount(4);
  await expect(photos.locator("figcaption")).toHaveText([
    "Recent work: workshop build",
    "Bathroom fan",
    "Mini-split install, photo 1 of 2",
    "Mini-split install, photo 2 of 2",
  ]);
  for (const photo of await photos.all()) {
    const img = photo.getByRole("img");
    await expect(img).toHaveAttribute("alt", /\w/);
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    await expect(photo).not.toContainText("$");
  }
  await expect(
    page.getByRole("region", { name: "Recent work" }).getByRole("img"),
  ).toHaveCount(3);
});

test("Gmail and Outlook open a compose window with the copied request", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
    });
  });
  await stubWebMail(page);
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") submissions.push(request.url());
  });
  await page.goto("./");
  const contact = page.getByRole("region", { name: "What needs a hand?" });
  await expect(contact).toContainText(
    "If nothing opens, copy the request and paste it into an email to info@kamotec.io.",
  );
  await contact.getByLabel("Name (optional)").fill("Sam");
  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  const job = contact.getByLabel("What needs doing?", { exact: true });
  await job.fill("Fix the entry door & trim.\nThe frame sticks.");
  await page
    .getByRole("listitem")
    .filter({
      has: page.getByRole("button", { name: "TV mount", exact: true }),
    })
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await contact
    .getByRole("button", { name: "Copy request", exact: true })
    .click();
  const copied = await page.evaluate(
    () => (window as unknown as { copied: string }).copied,
  );
  expect(copied).toContain("- TV mount");

  for (const mail of webMail) {
    const [compose] = await Promise.all([
      page.context().waitForEvent("page"),
      webMailButton(page, mail.name).click(),
    ]);
    await compose.waitForLoadState();
    const url = compose.url();
    expect(url.startsWith(mail.prefix)).toBe(true);
    expect(url).not.toContain("+");
    expect(url).toContain("%0A");
    const params = new URL(url).searchParams;
    expect(params.get(mail.to)).toBe("info@kamotec.io");
    expect(params.get(mail.subject)).toBe("Walkthrough request");
    expect(params.get("body")).toBe(copied);
    expect(await compose.evaluate(() => window.opener)).toBeNull();
    expect(await compose.evaluate(() => document.referrer)).toBe("");
    await compose.close();
    await expect(contact.getByRole("status")).toContainText(mail.name);
    await expect(contact.getByRole("status")).not.toContainText("sent");
  }

  await job.fill("Only the trim now.");
  const [compose] = await Promise.all([
    page.context().waitForEvent("page"),
    webMailButton(page, "Gmail").click(),
  ]);
  await compose.waitForLoadState();
  const body = new URL(compose.url()).searchParams.get("body")!;
  expect(body).toContain("Only the trim now.");
  expect(body).not.toContain("entry door");
  expect(submissions).toEqual([]);
});

test("web mail opens nothing for an invalid or overlong request and works from the keyboard", async ({
  page,
  browserName,
}) => {
  const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
  await stubWebMail(page);
  await page.goto("./");
  const contact = page.getByRole("region", { name: "What needs a hand?" });
  const message = contact.getByLabel("What needs doing?", { exact: true });
  const pages = () => page.context().pages().length;
  for (const mail of webMail) {
    await message.fill("Fix the gate.");
    await webMailButton(page, mail.name).click();
    await expect(contact.getByLabel("Email", { exact: true })).toBeFocused();
    await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
    await message.fill("   ");
    await webMailButton(page, mail.name).click();
    await expect(message).toBeFocused();
    await expect(contact.getByRole("status")).toBeEmpty();
    await message.fill("A repair detail. ".repeat(200));
    await webMailButton(page, mail.name).click();
    await expect(contact.getByRole("status")).toContainText(
      "too long for a reliable email link",
    );
    await expect(contact.getByLabel("Your request text")).toContainText(
      "A repair detail.",
    );
    await contact.getByLabel("Email", { exact: true }).fill("");
  }
  await page.waitForTimeout(300);
  expect(pages()).toBe(1);

  await contact.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await message.fill("Fix the gate.");
  await contact
    .getByRole("button", { name: "Open email draft", exact: true })
    .focus();
  for (const mail of webMail) {
    await page.keyboard.press(tab);
    await expect(webMailButton(page, mail.name)).toBeFocused();
    const [compose] = await Promise.all([
      page.context().waitForEvent("page"),
      page.keyboard.press("Enter"),
    ]);
    await compose.close();
  }
  await page.keyboard.press(tab);
  await expect(
    contact.getByRole("button", { name: "Copy request", exact: true }),
  ).toBeFocused();
});

for (const width of [320, 390]) {
  test(`the pricing sources page stays at screen width on a ${width}px phone`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./sources.html");
    await expect(
      page.getByRole("heading", { name: "Market band sources" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]),
    ).toEqual([width, width]);
    await expect(
      page.getByRole("link", {
        name: "https://homeguide.com/costs/faucet-installation-cost (opens in a new tab)",
        exact: true,
      }),
    ).toBeVisible();
  });
}
