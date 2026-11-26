import { expect, test } from '@playwright/test';
import { CreateBusiness, SignUp } from './helpers';

test.describe('a new owner setting up their business', () => {
  test('starts with an empty business of their kind', async ({ page }) => {
    await SignUp(page);
    await expect(page.getByText(/sample data/i)).toHaveCount(0);
    await CreateBusiness(page, { type: /Retail/, name: 'Harbour Goods' });
    await expect(page.getByText('Harbour Goods is ready')).toBeVisible();

    await page.goto('/inventory');
    await expect(page.getByText(/ELC-\d+/)).toHaveCount(0);
  });
});

test.describe('the shared demo account', () => {
  test('is one click from the sign-in page, full of sample data', async ({ page }) => {
    await page.goto('/login');
    const note = page.getByRole('complementary', { name: 'Just looking around?' });
    await expect(note.getByText('sampledata@gmail.com')).toBeVisible();
    await expect(note.getByText('sampledata123')).toBeVisible();

    await note.getByRole('button', { name: 'Explore the demo' }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await page.goto('/inventory');
    await expect(page.getByText(/^[A-Z]{3}-\d{3,4}$/).first()).toBeVisible();
  });

  test('signs in with the credentials typed in, too', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('sampledata@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('sampledata123');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  });
});
