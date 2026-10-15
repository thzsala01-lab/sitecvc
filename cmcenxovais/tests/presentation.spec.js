import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: '{"user":null}',
    }),
  );
});
test("photo introduction waits five seconds and scrolls to the automatic real product carousel", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".hero")).toHaveClass(/hero-ready/);
  await expect(
    page.locator("canvas,[data-view-model],[data-house]"),
  ).toHaveCount(0);
  await expect(page.locator(".hero__mobile-image")).toHaveAttribute(
    "src",
    "/assets/cmc-hero-cama-frontal.png",
  );
  await page.waitForTimeout(3000);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(30);
  await expect(page.locator(".hero")).toHaveAttribute(
    "data-intro-complete",
    "true",
  );
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await expect(page.locator(".product-studio")).toHaveAttribute(
    "data-active-product",
    "1",
    { timeout: 12000 },
  );
  await expect(page.locator("[data-real-product-photo]")).toHaveAttribute(
    "src",
    "/assets/products/chaleira.png",
  );
  await page.locator("[data-studio-motion]").click();
  const selected = await page
    .locator(".product-studio")
    .getAttribute("data-active-product");
  await page.waitForTimeout(5300);
  await expect(page.locator(".product-studio")).toHaveAttribute(
    "data-active-product",
    selected,
  );
  for (let i = 0; i < 4; i++) {
    await page.locator(`[data-product="${i}"]`).click();
    await expect(page.locator(`[data-product="${i}"]`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      await page
        .locator("[data-real-product-photo]")
        .evaluate((img) => img.complete && img.naturalWidth > 0),
    ).toBe(true);
  }
  await page.locator("[data-studio-next]").click();
  await expect(page.locator(".product-studio")).toHaveAttribute(
    "data-active-product",
    "0",
  );
  await expect(page.locator("[data-studio-cta]")).toHaveAttribute(
    "href",
    /wa.me/,
  );
});
test("manual navigation cancels the introductory scroll", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero")).toHaveClass(/hero-ready/);
  await page.locator("[data-hero-motion]").click();
  await page.waitForTimeout(5500);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(30);
  await expect(page.locator(".hero")).not.toHaveAttribute(
    "data-intro-complete",
    "true",
  );
});
test("mobile real photos fit the page and reduced motion pauses automatic rotation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#experiencia-3d");
  await expect(page.locator("[data-studio-motion]")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator('[data-product="2"]').click();
  await expect(page.locator("[data-real-product-photo]")).toHaveAttribute(
    "src",
    "/assets/products/air-fryer.png",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/cmc-presentation-mobile.png",
    fullPage: false,
  });
});

test("whole product photos crossfade without masks and rapid selection keeps the latest product", async ({
  page,
}) => {
  await page.goto("/#experiencia-3d");
  await expect(page.locator(".product-studio")).toHaveAttribute(
    "data-active-product",
    "0",
  );
  await page.locator('[data-product="1"]').click();
  await expect(page.locator(".product-studio")).toHaveAttribute(
    "data-active-product",
    "1",
  );
  await expect(page.locator(".product-photo-outgoing")).toHaveCount(1);
  expect(
    await page
      .locator("[data-real-product-photo]")
      .evaluate((el) => getComputedStyle(el).clipPath),
  ).toBe("none");
  expect(
    await page
      .locator("[data-real-product-photo]")
      .evaluate((el) => getComputedStyle(el).objectFit),
  ).toBe("contain");
  await expect(page.locator(".product-photo-outgoing")).toHaveCount(0);
  await expect(page.locator(".studio-word")).toHaveText("Chaleira");
  await page.locator("[data-studio-motion]").click();
  for (const i of [2, 3, 0, 2])
    await page.locator(`[data-product="${i}"]`).click();
  await expect(page.locator(".product-studio")).toHaveAttribute(
    "data-active-product",
    "2",
  );
  await expect(page.locator("[data-real-product-photo]")).toHaveAttribute(
    "src",
    "/assets/products/air-fryer.png",
  );
  await expect(
    page.locator(
      ".product-kettle-lid,.product-drawer--left,.product-drawer--right",
    ),
  ).toHaveCount(0);
  const host = await page.locator(".studio-photo-host").boundingBox();
  const copy = await page.locator(".studio-copy").boundingBox();
  expect(host.y + host.height).toBeLessThan(copy.y + 10);
});
