import { expect, test } from "@playwright/test";

const storyUrl = "/iframe.html?id=dashboard-overview--playground&viewMode=story";

test.describe("Dashboard playground", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(storyUrl);
    await expect(page.locator(".react-grid-item")).toHaveCount(2);
  });

  test("drags a widget from its header and persists the new position", async ({ page }) => {
    const widget = page.locator(".react-grid-item").filter({ hasText: "Storybook: First" });
    const header = widget.locator(".widget-header");
    const before = await widget.boundingBox();
    const headerBox = await header.boundingBox();

    expect(before).not.toBeNull();
    expect(headerBox).not.toBeNull();
    if (!before || !headerBox) return;

    await page.mouse.move(headerBox.x + 40, headerBox.y + headerBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(headerBox.x + 280, headerBox.y + headerBox.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect.poll(async () => (await widget.boundingBox())?.x).not.toBe(before.x);
  });

  test("resizes a widget from its south-east handle and persists the new size", async ({
    page,
  }) => {
    const widget = page.locator(".react-grid-item").filter({ hasText: "Storybook: First" });
    const handle = widget.locator(".react-resizable-handle-se");
    const before = await widget.boundingBox();
    const handleBox = await handle.boundingBox();

    expect(before).not.toBeNull();
    expect(handleBox).not.toBeNull();
    if (!before || !handleBox) return;

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 200, handleBox.y + 120, { steps: 10 });
    await page.mouse.up();

    await expect
      .poll(async () => (await widget.boundingBox())?.width)
      .toBeGreaterThan(before.width);
    await expect
      .poll(async () => (await widget.boundingBox())?.height)
      .toBeGreaterThan(before.height);
  });
});
