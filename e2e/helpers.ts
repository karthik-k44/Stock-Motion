import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'correct-horse-battery';

/** An email no other test (or earlier run against a reused server) has signed up with. */
export const UniqueEmail = (): string => `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

/** Sign up through the form; a new account lands on choosing a plan. */
export const SignUp = async (page: Page, email = UniqueEmail()): Promise<string> => {
  await page.goto('/signup');
  await page.getByLabel('Your name').fill('E2E Owner');
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/plans$/);
  return email;
};

/** On the plans page: choose a plan and how many inventories, and skip paying with the free trial. Lands on setup. */
export const StartTrial = async (page: Page, opts: { plan: 'Starter' | 'Pro'; inventories: number; yearly?: boolean }): Promise<void> => {
  await page.getByRole('radio', { name: new RegExp(`^${opts.plan}`) }).click();
  await page.getByLabel('Number of inventories').fill(String(opts.inventories));
  if (opts.yearly) await page.getByRole('radio', { name: /Yearly/ }).click();
  await page.getByRole('button', { name: /Start 14-day free trial/ }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
};

/** On setup: one inventory of each kind given (in order), named as given, then create them all. Ends on the dashboard. */
export const CreateInventories = async (page: Page, inventories: { type: RegExp; name: string }[]): Promise<void> => {
  for (const inv of inventories) await page.getByRole('button', { name: new RegExp(`One more .*${inv.type.source}`, 'i') }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  for (const [i, inv] of inventories.entries()) await page.getByLabel(new RegExp(`^Inventory ${i + 1} ·`)).fill(inv.name);
  await page.getByRole('button', { name: inventories.length === 1 ? 'Create inventory' : `Create ${inventories.length} inventories` }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
};

/** A new owner with one inventory on the free trial, inside the app. */
export const OwnerWithInventory = async (page: Page, inventory: { type: RegExp; name: string }): Promise<void> => {
  await SignUp(page);
  await StartTrial(page, { plan: 'Pro', inventories: 1 });
  await CreateInventories(page, [inventory]);
};
