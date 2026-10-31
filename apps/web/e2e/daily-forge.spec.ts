import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/v1/development/reset');
  await page.goto('/');
});

test('records a body challenge on the private wall', async ({ page }) => {
  await page.getByRole('button', { name: 'Accept today’s challenge' }).click();
  for (let index = 0; index < 4; index += 1) {
    await page.getByRole('button', { name: '+5', exact: true }).click();
  }

  await expect(page.getByRole('button', { name: 'Complete challenge' })).toBeEnabled();
  await page.getByRole('button', { name: 'Complete challenge' }).click();
  await expect(page.getByText('1 day of deliberate action')).toBeVisible();
  await page.getByRole('button', { name: 'View your wall' }).click();

  await expect(page.getByRole('heading', { name: 'Your Wall of Goodness' })).toBeVisible();
  await expect(page.getByText('20 push-ups', { exact: true })).toBeVisible();
  await expect(page.getByText('Practiced: consistency')).toBeVisible();
});

test('replaces without penalty and saves a private reflection', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: 'Try a different challenge' }).click();
  await expect(page.getByText('Replaced without penalty.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Practice one deliberate pause' })).toBeVisible();

  await page.getByRole('button', { name: 'Accept today’s challenge' }).click();
  for (const label of [
    'Name the choice without rushing it',
    'Consider who or what the choice may affect',
    'Choose and briefly note your reason',
  ]) {
    await page.getByRole('button', { name: label }).click();
  }
  await page
    .getByPlaceholder('What did you do or notice? This stays private.')
    .fill('I paused and chose a calmer response.');
  await page.getByRole('button', { name: 'Complete challenge' }).click();
  await page.getByRole('button', { name: 'View your wall' }).click();

  await expect(page.getByText('3 deliberate steps completed')).toBeVisible();
  await expect(page.getByText('I paused and chose a calmer response.')).toBeVisible();
  if (testInfo.project.name === 'pixel-6') {
    await expect(page.getByRole('navigation', { name: 'Primary mobile navigation' })).toBeVisible();
  }
});

test('records a consent-aware community action', async ({ page }) => {
  await page.getByRole('button', { name: 'Try a different challenge' }).click();
  await page.getByRole('button', { name: 'Try a different challenge' }).click();
  await expect(page.getByRole('heading', { name: 'Offer one concrete act of help' })).toBeVisible();

  await page.getByRole('button', { name: 'Accept today’s challenge' }).click();
  await page.getByRole('button', { name: 'I offered or gave useful help' }).click();
  await page.getByRole('button', { name: 'Complete challenge' }).click();
  await page.getByRole('button', { name: 'View your wall' }).click();

  await expect(page.getByText('One consent-aware act of help')).toBeVisible();
});

test('records a timed creative practice without becoming a running workout', async ({ page }) => {
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole('button', { name: 'Try a different challenge' }).click();
  }
  await expect(
    page.getByRole('heading', { name: 'Make a ten-minute constraint sketch' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Accept today’s challenge' }).click();
  await page.getByRole('button', { name: '+10 mins', exact: true }).click();
  await page.getByRole('button', { name: 'Complete challenge' }).click();
  await page.getByRole('button', { name: 'View your wall' }).click();

  await expect(page.getByText('10 minutes practiced')).toBeVisible();
});

test('exposes install metadata and has no horizontal overflow', async ({ page, request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  expect(await manifest.json()).toMatchObject({
    name: 'Daily Forge',
    display: 'standalone',
    start_url: '/',
  });
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('skips today without pressure or a completion', async ({ page }) => {
  await page.getByRole('button', { name: 'Skip for today' }).click();

  await expect(page.getByRole('heading', { name: 'Rest is allowed.' })).toBeVisible();
  await expect(page.getByText('No action is required today.')).toBeVisible();
  await expect(page.getByText('Your wall and completion totals are unchanged.')).toBeVisible();
});

test('has no automatically detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
