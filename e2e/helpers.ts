import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'correct-horse-battery';

/** An email no other test (or earlier run against a reused server) has signed up with. */
export const UniqueEmail = (): string => `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

/** Sign up through the form; a new account lands on the onboarding wizard. */
export const SignUp = async (page: Page, email = UniqueEmail()): Promise<string> => {
  await page.goto('/signup');
  await page.getByLabel('Your name').fill('E2E Owner');
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  return email;
};

/** Walk the onboarding wizard: kind of business → name → create. Ends inside the app. */
export const CreateBusiness = async (page: Page, opts: { type: RegExp; name: string }): Promise<void> => {
  await page.getByRole('radio', { name: opts.type }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Business name').fill(opts.name);
  await page.getByRole('button', { name: `Create ${opts.name}` }).click();
  await expect(page).toHaveURL(/\/world$/);
};
