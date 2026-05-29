import { test, expect } from '@playwright/test';

// Helper: on tablet/mobile viewports the desktop nav is hidden behind the hamburger.
// This opens the mobile menu if needed and returns the right nav locator to use.
async function getNavAndEnsureOpen(page) {
  const viewport = page.viewportSize();
  const isNarrow = viewport && viewport.width <= 1024;

  if (isNarrow) {
    // Open the hamburger menu so mobile nav links are visible
    const hamburger = page.getByRole('button', { name: /open navigation menu/i });
    const isExpanded = await hamburger.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await hamburger.click();
    }
    return page.getByRole('navigation', { name: 'Mobile navigation' });
  }

  return page.getByRole('navigation', { name: 'Main navigation' });
}

test.describe('Homepage / Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Copilot Insights Tracker/);
  });

  test('renders header with logo', async ({ page }) => {
    // Target the logo link by its aria-label
    await expect(
      page.getByRole('link', { name: /Virgin Money.*Copilot Insights Tracker home/i })
    ).toBeVisible();
  });

  test('renders all nav links', async ({ page }) => {
    const nav = await getNavAndEnsureOpen(page);
    await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Active Users' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Copilot Insights' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Reports' })).toBeVisible();
  });

  test('shows not-connected state when unconfigured', async ({ page }) => {
    // Target the overview empty-state heading, not the header status badge
    await expect(
      page.getByRole('heading', { name: 'Not connected' })
    ).toBeVisible();
  });

  test('has a link to settings', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Settings/i }).first()).toBeVisible();
  });

  test('renders footer with copyright', async ({ page }) => {
    await expect(page.getByText(/Virgin Money/)).toBeVisible();
  });

  test('navigates to setup page', async ({ page }) => {
    await page.getByRole('link', { name: /Settings/i }).first().click();
    await expect(page).toHaveURL('/setup');
    await expect(page.getByText('GitHub Configuration')).toBeVisible();
  });

  test('navigates to active users page', async ({ page }) => {
    const nav = await getNavAndEnsureOpen(page);
    await nav.getByRole('link', { name: 'Active Users' }).click();
    await expect(page).toHaveURL('/active-users');
  });

  test('navigates to copilot insights page', async ({ page }) => {
    const nav = await getNavAndEnsureOpen(page);
    await nav.getByRole('link', { name: 'Copilot Insights' }).click();
    await expect(page).toHaveURL('/copilot-insights');
  });

  test('navigates to reports page', async ({ page }) => {
    const nav = await getNavAndEnsureOpen(page);
    await nav.getByRole('link', { name: 'Reports' }).click();
    await expect(page).toHaveURL('/reports');
  });
});
