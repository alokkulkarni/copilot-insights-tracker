import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  const pages = [
    { name: 'Overview', path: '/' },
    { name: 'Active Users', path: '/active-users' },
    { name: 'Copilot Insights', path: '/copilot-insights' },
    { name: 'Reports', path: '/reports' },
    { name: 'Setup', path: '/setup' },
  ];

  for (const { name, path } of pages) {
    test(`${name} page has correct landmark roles`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('banner')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('contentinfo')).toBeVisible();
    });

    test(`${name} page has a skip-to-main or main id`, async ({ page }) => {
      await page.goto(path);
      const main = page.locator('#main-content');
      await expect(main).toBeAttached();
    });
  }

  test('all images have alt attributes', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeNull();
      expect(alt?.trim().length).toBeGreaterThan(0);
    }
  });

  test('form inputs on setup page have labels', async ({ page }) => {
    await page.goto('/setup');
    const inputs = page.locator('input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const id = await inputs.nth(i).getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeAttached();
      }
    }
  });

  test('nav has aria-label', async ({ page }) => {
    await page.goto('/');
    // Use DOM locator (not role) so we find navs regardless of visibility/aria-hidden state
    const navs = page.locator('nav');
    const count = await navs.count();
    expect(count).toBeGreaterThan(0);
    // Verify at least one nav has a non-empty aria-label
    let hasLabel = false;
    for (let i = 0; i < count; i++) {
      const label = await navs.nth(i).getAttribute('aria-label');
      if (label && label.trim().length > 0) {
        hasLabel = true;
        break;
      }
    }
    expect(hasLabel).toBe(true);
  });

  test('status indicator has aria-label', async ({ page }) => {
    await page.goto('/');
    const status = page.locator('[aria-label*="connected"]');
    await expect(status.first()).toBeAttached();
  });
});
