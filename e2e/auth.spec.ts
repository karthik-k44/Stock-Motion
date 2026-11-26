import { expect, test } from '@playwright/test';
import { CreateInventories, OwnerWithInventory, PASSWORD, SignUp, StartTrial } from './helpers';

test.describe('signing in', () => {
  test('keeps the session across a reload through the refresh cookie', async ({ page }) => {
    await OwnerWithInventory(page, { type: /Retail/, name: 'Reload Test' });

    // The access token lives in memory only, so a reload must renew it from the httpOnly cookie.
    await page.goto('/dashboard');
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  test('logs out, refuses a wrong password, and signs back in', async ({ page }) => {
    const email = await SignUp(page);
    await StartTrial(page, { plan: 'Pro', inventories: 1 });
    await CreateInventories(page, [{ type: /Retail/, name: 'Sign In Test' }]);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    // Signed out for real: the site URL shows the public front page, and the app sends people back to sign in.
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('not-the-password');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('That email and password do not match')).toBeVisible();

    await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  test('opens the app, not the front page, when someone signed in visits the site', async ({ page }) => {
    await OwnerWithInventory(page, { type: /Retail/, name: 'Portal Test' });

    await page.goto('/');
    await expect(page).toHaveURL(/\/world$/);
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  test('sends signed-out visitors to the sign-in page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
