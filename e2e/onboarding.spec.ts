import { expect, test } from '@playwright/test';
import { CreateBusiness, SignUp } from './helpers';

test.describe('a new owner setting up their business', () => {
  test('starts with the sample data of their kind of business', async ({ page }) => {
    await SignUp(page);
    await CreateBusiness(page, { type: /Retail/, name: 'Harbour Goods', sampleData: true });
    await expect(page.getByText('Harbour Goods is ready')).toBeVisible();

    await page.goto('/inventory');
    // The retail template's sample products, the same for every new owner.
    await expect(page.getByText('ELC-1001').first()).toBeVisible();
  });

  test('gets every owner the same sample data', async ({ browser }) => {
    const skus = async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await SignUp(page);
      await CreateBusiness(page, { type: /Café/, name: 'Corner Café', sampleData: true });
      await page.goto('/inventory');
      await expect(page.getByText('CAF-001').first()).toBeVisible();
      const text = await page.getByRole('main').innerText();
      await context.close();
      return [...new Set(text.match(/\b[A-Z]{3}-\d{3,4}\b/g))].sort();
    };
    const [first, second] = await Promise.all([skus(), skus()]);
    expect(first.length).toBeGreaterThan(0);
    expect(second).toEqual(first);
  });

  test('can start empty instead', async ({ page }) => {
    await SignUp(page);
    await CreateBusiness(page, { type: /Trades/, name: 'Spark Electrical', sampleData: false });
    await page.goto('/inventory');
    await expect(page.getByText(/MAT-\d+/)).toHaveCount(0);
  });
});
