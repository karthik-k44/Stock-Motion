import { expect, test } from '@playwright/test';
import { CreateInventories, SignUp, StartTrial } from './helpers';

test.describe('a new owner getting started', () => {
  test('chooses a plan, takes the free trial, and sets up exactly that many inventories', async ({ page }) => {
    await SignUp(page);
    await expect(page.getByRole('heading', { name: 'Choose your plan' })).toBeVisible();
    await StartTrial(page, { plan: 'Pro', inventories: 2 });

    // The kinds must add up to the inventories chosen.
    await page.getByRole('button', { name: /One more .*retail/i }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Choose a kind for each of your 2 inventories — 1 chosen so far')).toBeVisible();
    await page.getByRole('button', { name: /One fewer .*retail/i }).click();

    await CreateInventories(page, [
      { type: /Retail/, name: 'Harbour Goods' },
      { type: /Café/, name: 'Harbour Café' },
    ]);
    await expect(page.getByText('Your 2 inventories are ready')).toBeVisible();
    await expect(page.getByText(/sample data/i)).toHaveCount(0);

    await page.goto('/inventory');
    await expect(page.getByText(/ELC-\d+/)).toHaveCount(0);
  });

  test('is sent to choose a plan first when signing in before choosing one', async ({ page }) => {
    await SignUp(page);
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/plans$/);
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
