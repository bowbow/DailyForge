import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/v1/development/reset');
  await page.goto('/');
});

test('offers one challenge in each area', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Four ways to practice.' })).toBeVisible();
  await expect(page.locator('[data-category="body"]')).toBeVisible();
  await expect(page.locator('[data-category="character"]')).toBeVisible();
  await expect(page.locator('[data-category="community"]')).toBeVisible();
  await expect(page.locator('[data-category="creativity"]')).toBeVisible();
  await expect(page.getByText('0 of 4 completed')).toBeVisible();
  const creativity = page.locator('.challenge-card[data-category="creativity"]');
  await expect(
    creativity.getByRole('heading', { name: 'Paint a mountain-atmosphere baseline' }),
  ).toBeVisible();
  await expect(creativity.getByText('Express', { exact: true })).toBeVisible();
  await expect(creativity.getByText('Studio work', { exact: true })).toBeVisible();
  await expect(creativity.getByText('CG-01 · CG-04', { exact: true })).toBeVisible();

  const areaAccents = await page
    .locator('.challenge-card[data-category]')
    .evaluateAll((cards) =>
      cards.map((card) => getComputedStyle(card).getPropertyValue('--area-accent').trim()),
    );
  expect(areaAccents).toHaveLength(4);
  expect(new Set(areaAccents).size).toBe(4);
});

test('records a body challenge on the private wall', async ({ page }) => {
  const body = page.locator('[data-category="body"]');
  await body.getByRole('button', { name: 'Accept this challenge' }).click();
  for (let index = 0; index < 4; index += 1) {
    await body.getByRole('button', { name: '+5', exact: true }).click();
  }
  await body.getByRole('button', { name: 'Complete challenge' }).click();

  await expect(page.getByText('1 of 4 completed')).toBeVisible();
  await expect(body.getByText('3 days of deliberate action')).toBeVisible();
  await body.getByRole('button', { name: 'View your wall' }).click();
  await expect(page.getByText('20 push-ups', { exact: true })).toBeVisible();
});

test('records Creativity program context with a completed studio episode', async ({ page }) => {
  const creativity = page.locator('.challenge-card[data-category="creativity"]');
  await creativity.getByRole('button', { name: 'Accept this challenge' }).click();
  await creativity.getByRole('button', { name: '+15 mins', exact: true }).click();
  await creativity.getByRole('button', { name: 'Complete challenge' }).click();
  await creativity.getByRole('button', { name: 'View your wall' }).click();

  const entry = page.locator('.wall-card[data-category="creativity"]').first();
  await expect(
    entry.getByRole('heading', { name: 'Paint a mountain-atmosphere baseline' }),
  ).toBeVisible();
  await expect(
    entry.getByText(/Studio context: Express · Studio work · CG-01 · CG-04/),
  ).toBeVisible();
});

test('completes multiple categories while the daily streak advances once', async ({ page }) => {
  const body = page.locator('[data-category="body"]');
  await body.getByRole('button', { name: 'Accept this challenge' }).click();
  for (let index = 0; index < 4; index += 1) {
    await body.getByRole('button', { name: '+5', exact: true }).click();
  }
  await body.getByRole('button', { name: 'Complete challenge' }).click();

  const character = page.locator('[data-category="character"]');
  await character.getByRole('button', { name: 'Accept this challenge' }).click();
  for (const label of [
    'Name the choice without rushing it',
    'Consider who or what the choice may affect',
    'Choose and briefly note your reason',
  ]) {
    await character.getByRole('button', { name: label }).click();
  }
  await character.getByRole('button', { name: 'Complete challenge' }).click();

  await expect(page.getByText('2 of 4 completed')).toBeVisible();
  await expect(character.getByText('3 days of deliberate action')).toBeVisible();
  await expect(character.getByText('16 challenges completed in total')).toBeVisible();
});

test('starts with a rich but clearly fictional development history', async ({ page }) => {
  await page.locator('nav:visible').getByRole('button', { name: 'Wall', exact: true }).click();
  await expect(page.locator('.wall-card')).toHaveCount(14);
  await expect(
    page.getByText('The rough edge made the shadows feel less mechanical.'),
  ).toBeVisible();

  await page.locator('nav:visible').getByRole('button', { name: 'History', exact: true }).click();
  await expect(
    page.locator('.stat-grid article').filter({ hasText: 'Lifetime actions' }).getByText('14'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The last ten days' })).toBeVisible();
  await expect(page.getByText('No completion recorded').first()).toBeVisible();
  await expect(page.getByText('2 actions completed').first()).toBeVisible();
});

test('replaces within an area and skips another independently', async ({ page }) => {
  const body = page.locator('[data-category="body"]');
  await body.getByRole('button', { name: 'Try a different body challenge' }).click();
  await expect(
    page.getByRole('heading', { name: 'Take a five-minute mobility reset' }),
  ).toBeVisible();
  await expect(page.getByText('Replaced without penalty.')).toBeVisible();

  const community = page.locator('[data-category="community"]');
  await community.getByRole('button', { name: 'Skip this area today' }).click();
  await expect(community.getByText('No action is required in Community today.')).toBeVisible();
  await expect(page.locator('[data-category="character"]')).toContainText('Available today');
  await expect(page.locator('[data-category="creativity"]')).toContainText('Available today');
});

test('explains the goals and boundaries of each area', async ({ page }) => {
  await page.locator('nav:visible').getByRole('button', { name: 'Areas', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'What are we building?' })).toBeVisible();
  await expect(
    page.getByText(/Build and preserve the practical strength, mobility, balance/),
  ).toBeVisible();
  await expect(
    page.getByText(/No aerobic challenges, mileage, pace targets, or intervals/),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Start with the life you want at 80.' }),
  ).toBeVisible();
  await expect(page.getByText('B80-01', { exact: true })).toBeVisible();
  await expect(page.getByText('B80-10', { exact: true })).toBeVisible();
  await expect(page.getByText('Find the baseline', { exact: true })).toBeVisible();
  await expect(page.getByText('Probes, not tests to fail', { exact: true })).toBeVisible();
  const centenarianResource = page.getByRole('link', {
    name: /Training for the Centenarian Decathlon/,
  });
  await expect(centenarianResource).toHaveAttribute(
    'href',
    'https://peterattiamd.com/training-for-the-centenarian-decathlon/',
  );
  await expect(centenarianResource).toHaveAttribute('target', '_blank');
  const bodyTheme = await page
    .locator('.area-detail')
    .evaluate((detail) => getComputedStyle(detail).getPropertyValue('--area-accent').trim());
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  await page.getByRole('button', { name: 'creativity', exact: true }).click();
  await expect(
    page.getByText(/Create atmospheric, mountain-dominant digital landscapes/).first(),
  ).toBeVisible();
  await expect(page.getByText(/Sharing artwork is never required as proof/)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Paint atmosphere, not software expertise.' }),
  ).toBeVisible();
  await expect(page.getByText('CG-01', { exact: true })).toBeVisible();
  await expect(page.getByText('CG-06', { exact: true })).toBeVisible();
  await expect(page.getByText('Mountain atmosphere: immensity', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('.work-status')).toHaveText('paused');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.work-status')).toHaveText('active');
  const creativityTheme = await page
    .locator('.area-detail')
    .evaluate((detail) => getComputedStyle(detail).getPropertyValue('--area-accent').trim());
  expect(creativityTheme).not.toBe(bodyTheme);
});

test('exposes install metadata and has no horizontal overflow', async ({ page, request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  expect(await manifest.json()).toMatchObject({
    name: 'Daily Forge',
    display: 'standalone',
    start_url: '/',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('has no automatically detectable accessibility violations', async ({ page }) => {
  const todayResults = await new AxeBuilder({ page }).analyze();
  expect(todayResults.violations).toEqual([]);

  await page.locator('nav:visible').getByRole('button', { name: 'Areas', exact: true }).click();
  const areasResults = await new AxeBuilder({ page }).analyze();
  expect(areasResults.violations).toEqual([]);
});
