import { test, expect } from '@playwright/test';

test.describe('Setup / Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/setup');
  });

  test('renders the settings form', async ({ page }) => {
    await expect(page.getByText('GitHub Configuration')).toBeVisible();
    await expect(page.getByLabel(/Organisation name/i)).toBeVisible();
    await expect(page.getByLabel(/Personal Access Token/i)).toBeVisible();
    await expect(page.getByLabel(/API Base URL/i)).toBeVisible();
  });

  test('token field is type password', async ({ page }) => {
    const tokenInput = page.getByLabel(/Personal Access Token/i);
    await expect(tokenInput).toHaveAttribute('type', 'password');
  });

  test('save button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Save & Connect/i })).toBeVisible();
  });

  test('has link to create GitHub token', async ({ page }) => {
    const link = page.getByRole('link', { name: /Create a token/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://github.com/settings/tokens/new');
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('form fields accept input', async ({ page }) => {
    await page.getByLabel(/Organisation name/i).fill('my-test-org');
    await expect(page.getByLabel(/Organisation name/i)).toHaveValue('my-test-org');
  });
});
