import { test, expect } from '@playwright/test';

// These tests run on mobile viewport projects defined in playwright.config.js
test.describe('Mobile navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('hamburger button is visible on mobile', async ({ page }) => {
    const hamburger = page.getByRole('button', { name: /open navigation menu/i });
    // On mobile viewports this should be visible
    const viewport = page.viewportSize();
    if (viewport && viewport.width <= 768) {
      await expect(hamburger).toBeVisible();
    }
  });

  test('mobile menu opens and shows nav links', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width > 768) {
      test.skip();
      return;
    }

    const hamburger = page.getByRole('button', { name: /open navigation menu/i });
    await hamburger.click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
  });

  test('touch targets are large enough', async ({ page }) => {
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const box = await btn.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('page does not overflow horizontally', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 375;
    // Allow up to 20px tolerance for scrollbar width on some browsers
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
