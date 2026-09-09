import { expect, test } from "@playwright/test";

/**
 * Visual regression tests for ScrollTimeline.
 *
 * These tests load the ScrollTimeline stories in Storybook's iframe,
 * wait for the double-rAF position computation to settle, then capture
 * screenshots and compare them against committed baselines.
 *
 * If the visual output changes intentionally, update baselines:
 *   pnpm --filter @ay/ui-library exec playwright test --update-snapshots scroll-timeline
 */

// Helper: wait for the double-rAF + ResizeObserver to settle dot positions
async function waitForTimelineReady(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  // Wait for images to load (picsum in stories)
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; }),
      ),
    );
  });
  // Double rAF + small delay for ResizeObserver
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 200);
          });
        });
      }),
  );
}

test.describe("ScrollTimeline visual regression", () => {
  test("Default story renders dots at distinct positions", async ({ page }) => {
    await page.goto("/iframe.html?id=blocks-scrolltimeline--default&viewMode=story");
    await waitForTimelineReady(page);

    // Verify SVG has rendered with dots at different y positions
    const groups = page.locator("svg.scroll-timeline-svg g");
    await expect(groups).toHaveCount(6);

    // Verify the transforms are distinct (not all at 0%)
    const transforms = await page.evaluate(() => {
      const els = document.querySelectorAll("svg.scroll-timeline-svg g");
      return Array.from(els).map((el) => el.getAttribute("transform") || "");
    });

    // SVG transform attributes use explicit user-unit Y coordinates. Percentage
    // transforms are not consistently resolved by browsers and stack at 0.
    expect(transforms.length).toBe(6);
    transforms.forEach((t) => {
      expect(t).toContain("translate(0,");
    });

    // Positions should be monotonically increasing
    const pcts = transforms.map((t) => {
      const m = t.match(/translate\(0,\s*([\d.]+)\)/);
      return m ? Number.parseFloat(m[1]) : -1;
    });
    for (let i = 1; i < pcts.length; i++) {
      expect(pcts[i]).toBeGreaterThan(pcts[i - 1]);
    }

    // Screenshot comparison
    await expect(page).toHaveScreenshot("scroll-timeline-default.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("ManySections story renders 12 dots", async ({ page }) => {
    await page.goto("/iframe.html?id=blocks-scrolltimeline--manysections&viewMode=story");
    await waitForTimelineReady(page);

    const groups = page.locator("svg.scroll-timeline-svg g");
    await expect(groups).toHaveCount(12);

    // Verify positions are distinct
    const transforms = await page.evaluate(() => {
      const els = document.querySelectorAll("svg.scroll-timeline-svg g");
      return Array.from(els).map((el) => el.getAttribute("transform") || "");
    });

    const pcts = transforms.map((t) => {
      const m = t.match(/translate\(0,\s*([\d.]+)\)/);
      return m ? Number.parseFloat(m[1]) : -1;
    });
    for (let i = 1; i < pcts.length; i++) {
      expect(pcts[i]).toBeGreaterThan(pcts[i - 1]);
    }

    await expect(page).toHaveScreenshot("scroll-timeline-many-sections.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("CustomNavWidth story renders wider nav", async ({ page }) => {
    await page.goto("/iframe.html?id=blocks-scrolltimeline--customnavwidth&viewMode=story");
    await waitForTimelineReady(page);

    const svg = page.locator("svg.scroll-timeline-svg");
    await expect(svg).toHaveAttribute("width", "200");

    await expect(page).toHaveScreenshot("scroll-timeline-custom-nav-width.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("SingleSection story renders one dot", async ({ page }) => {
    await page.goto("/iframe.html?id=blocks-scrolltimeline--singlesection&viewMode=story");
    await waitForTimelineReady(page);

    const groups = page.locator("svg.scroll-timeline-svg g");
    await expect(groups).toHaveCount(1);

    await expect(page).toHaveScreenshot("scroll-timeline-single-section.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});
