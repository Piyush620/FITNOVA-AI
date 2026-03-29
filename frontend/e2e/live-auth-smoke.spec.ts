import { expect, test } from '@playwright/test';

const liveEmail = process.env.FITNOVA_E2E_LIVE_EMAIL;
const livePassword = process.env.FITNOVA_E2E_LIVE_PASSWORD;

test('@live user can log in against the local stack and reach the dashboard', async ({ page }) => {
  test.skip(
    !liveEmail || !livePassword,
    'Set FITNOVA_E2E_LIVE_EMAIL and FITNOVA_E2E_LIVE_PASSWORD to run live E2E smoke tests.',
  );

  await page.goto('/login');

  await page.getByLabel('Email').fill(liveEmail!);
  await page.getByLabel('Password', { exact: true }).fill(livePassword!);
  await page.getByRole('button', { name: 'Sign In' }).click({ force: true });

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

  await page.locator('header').getByRole('button', { name: 'Workouts', exact: true }).click({ force: true });
  await expect(page).toHaveURL(/\/workouts$/);
  await expect(page.getByRole('heading', { name: /build your/i })).toBeVisible();
});
