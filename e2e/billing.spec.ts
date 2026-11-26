import { expect, test } from '@playwright/test';
import { CreateInventories, SignUp, StartTrial } from './helpers';

test.describe('billing', () => {
  test('prices plans per inventory, monthly or yearly, with a live total', async ({ page }) => {
    await SignUp(page);
    const pro = page.getByRole('radio', { name: /^Pro/ });
    await expect(pro.getByText('₹699', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('radio', { name: /^Starter/ }).getByText('₹299', { exact: true }).first()).toBeVisible();

    await page.getByLabel('Number of inventories').fill('3');
    await pro.click();
    await expect(page.getByRole('region', { name: 'Your choice' }).getByText('₹2,097', { exact: true })).toBeVisible();

    await page.getByRole('radio', { name: /Yearly/ }).click();
    await expect(pro.getByText('₹6,990', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Your choice' }).getByText('₹20,970', { exact: true })).toBeVisible();
    await expect(page.getByText('You save ₹4,194 a year')).toBeVisible();

    // The payment page confirms the same order. The end-to-end server has no Razorpay keys and runs in production
    // mode, so it says payments aren't set up instead of offering to pay.
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await expect(page).toHaveURL(/\/checkout\?plan=PRO&interval=YEARLY&quantity=3$/);
    const summary = page.getByRole('complementary', { name: 'Order summary' });
    await expect(summary.getByText('₹6,990 × 3 inventories')).toBeVisible();
    await expect(summary.getByText('₹20,970', { exact: true })).toBeVisible();
    await expect(page.getByText(/Payments aren’t set up on this server/)).toBeVisible();
  });

  test('the free trial covers the inventories chosen, and the next bill is for that many', async ({ page }) => {
    await SignUp(page);
    await StartTrial(page, { plan: 'Pro', inventories: 2 });
    await CreateInventories(page, [
      { type: /Retail/, name: 'Billing One' },
      { type: /Trades/, name: 'Billing Two' },
    ]);

    await page.getByRole('link', { name: 'Billing' }).click();
    await expect(page).toHaveURL(/\/billing$/);
    await expect(page.getByText(/Free trial for 2 inventories — 1[34] days left/)).toBeVisible();
    await expect(page.getByText(/Next bill:.*Pro, 2 inventories — ₹1,398 \/ month/)).toBeVisible();
    await expect(page.getByText('2 of 2 set up')).toBeVisible();
  });

  test('the pricing page works out the price for the inventories and interval chosen', async ({ page }) => {
    await page.goto('/pricing');
    // The plans are below the fold and animate in as they scroll into view.
    const pro = page.locator('article[aria-label^="Pro,"]');
    await pro.scrollIntoViewIfNeeded();
    await expect(pro.getByText('₹699', { exact: true }).first()).toBeVisible();
    await expect(page.locator('article[aria-label^="Starter,"]').getByText('₹299', { exact: true }).first()).toBeVisible();

    await page.getByLabel('Number of inventories').fill('3');
    await expect(pro.getByText('₹2,097', { exact: true })).toBeVisible();
    await page.getByRole('radio', { name: /Yearly/ }).click();
    await expect(pro.getByText('₹6,990', { exact: true })).toBeVisible();
    await expect(pro.getByText('₹20,970', { exact: true })).toBeVisible();
    await expect(pro.getByText('· save ₹4,194')).toBeVisible();

    // Signing up from there carries the choice through to the plans page.
    await pro.getByRole('link', { name: 'Go Pro' }).click();
    await expect(page).toHaveURL(/\/signup\?next=/);
    await page.getByLabel('Your name').fill('E2E Owner');
    await page.getByLabel('Email address').fill(`pricing-${Date.now()}@example.com`);
    await page.getByRole('textbox', { name: 'Password' }).fill('correct-horse-battery');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/plans\?plan=PRO&interval=YEARLY&quantity=3$/);
    await expect(page.getByLabel('Number of inventories')).toHaveValue('3');
  });

  test('an owner without payments sees an empty invoices page', async ({ page }) => {
    await SignUp(page);
    await StartTrial(page, { plan: 'Starter', inventories: 1 });
    await CreateInventories(page, [{ type: /Retail/, name: 'Invoice Test' }]);
    await page.getByRole('link', { name: 'Invoices' }).click();
    await expect(page).toHaveURL(/\/invoices$/);
    await expect(page.getByText('No invoices yet')).toBeVisible();
  });
});
