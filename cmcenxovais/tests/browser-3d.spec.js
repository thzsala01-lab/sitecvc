import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // The visual workflow is independent of the unchanged MySQL auth service.
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: "{}" }),
  );
});
test("camera reaches a closed door, waits for the visitor, opens and enters; products are interactive meshes", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const house = page.locator("[data-house]");
  await expect(house).toHaveAttribute("data-house-ready", "true");
  await expect(page.locator(".house-canvas canvas")).toHaveCount(1);
  await expect(
    page.locator(".house-canvas img,.house-canvas video"),
  ).toHaveCount(0);
  await expect(house).toHaveAttribute("data-house-phase", "waiting", {
    timeout: 90000,
  });
  const cameraBefore = await page
    .locator("[data-house-canvas]")
    .getAttribute("data-camera-z");
  await expect(page.locator("[data-house-enter]")).toBeVisible();
  await page.waitForTimeout(450);
  expect(
    await page.locator("[data-house-canvas]").getAttribute("data-door-angle"),
  ).toBe("0.000");
  expect(
    await page.locator("[data-house-canvas]").getAttribute("data-camera-z"),
  ).toBe(cameraBefore);
  await page.locator("[data-house-enter]").click();
  await expect(house).toHaveAttribute("data-house-phase", "entered", {
    timeout: 60000,
  });
  expect(
    Number(
      await page.locator("[data-house-canvas]").getAttribute("data-door-angle"),
    ),
  ).toBeGreaterThan(1.5);
  expect(
    Number(
      await page.locator("[data-house-canvas]").getAttribute("data-camera-z"),
    ),
  ).toBeLessThan(-9);
  await page.locator(".house-actions a").click();
  const studio = page.locator(".product-studio"),
    host = page.locator(".studio-canvas");
  await expect(studio).toHaveAttribute("data-viewer-state", "ready");
  await expect(host.locator("canvas")).toHaveCount(1);
  await expect(host.locator("img,video")).toHaveCount(0);
  for (const [index, key] of [
    "glass",
    "kettle",
    "fryer",
    "cushion",
    "towel",
  ].entries()) {
    await page.locator(`button[data-product="${index}"]`).click();
    await expect(studio).toHaveAttribute("data-active-model", key);
    expect(
      Number(await host.getAttribute("data-model-meshes")),
    ).toBeGreaterThan(0);
  }
  await page.locator('button[data-product="2"]').click();
  await page.locator("[data-product-demo]").click();
  await expect
    .poll(async () => Number(await host.getAttribute("data-demo-time")))
    .toBeGreaterThan(1);
  await page.locator("[data-studio-motion]").click();
  const time = await host.getAttribute("data-demo-time");
  await page.waitForTimeout(350);
  expect(await host.getAttribute("data-demo-time")).toBe(time);
  await host.focus();
  const angle = await host.getAttribute("data-orbit");
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => host.getAttribute("data-orbit")).not.toBe(angle);
  const bounds = await host.boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width * 0.45,
    bounds.y + bounds.height * 0.5,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * 0.75,
    bounds.y + bounds.height * 0.5,
    { steps: 8 },
  );
  await page.mouse.up();
  await expect(page.locator("a.header-login")).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(page.locator("a[data-studio-cta]")).toHaveAttribute(
    "href",
    /wa.me\/5537988424250/,
  );
  expect(errors).toEqual([]);
});
test("mobile and reduced motion preserve an explicit entry gate, orbit controls and scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-house]")).toHaveAttribute(
    "data-house-phase",
    "waiting",
  );
  await page.locator("[data-house-enter]").click();
  await expect(page.locator("[data-house]")).toHaveAttribute(
    "data-house-phase",
    "entered",
  );
  await page.locator(".house-actions a").click();
  await expect(page.locator(".product-studio")).toHaveAttribute(
    "data-viewer-state",
    "ready",
  );
  await page.locator('[data-product="2"]').click();
  await expect(page.locator(".product-studio")).toHaveAttribute(
    "data-demo-state",
    "paused",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const canvas = page.locator(".studio-canvas canvas");
  expect(await canvas.evaluate((el) => Boolean(el.getContext("webgl2")))).toBe(
    true,
  );
  await page.locator("[data-product-reset]").click();
  await expect(page.locator("#produtos")).toBeAttached();
});
test("WebGL failure leaves the site and existing catalog links accessible", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === "webgl2" || type === "webgl") return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto("/");
  await expect(page.locator("[data-house]")).toHaveAttribute(
    "data-house-phase",
    "unavailable",
  );
  await page.locator(".house-actions a").click();
  await expect(page.locator(".product-studio")).toHaveAttribute(
    "data-viewer-state",
    "unavailable",
  );
  await expect(page.locator('header a[href="/login"]')).toBeAttached();
  await expect(page.locator(".viewer-unavailable")).toBeVisible();
  await page.locator('[data-product="2"]').click();
  await expect(page.locator("[data-studio-cta]")).toHaveAttribute(
    "href",
    /wa.me/,
  );
});
