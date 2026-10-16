import { expect, test } from '@playwright/test';

const url = '/docs/components/loading-and-progress/progress-indicator';
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await expect(page.locator('mat-exp-progress-indicator')).toHaveCount(4);
});

test('known/unknown progress preserves labels and all four configurations', async ({ page }) => {
  const indicators = page.locator('mat-exp-progress-indicator');
  for (const indicator of await indicators.all()) {
    await expect(indicator).toHaveAttribute('aria-label', 'Uploading photos');
    await expect(indicator).toHaveAttribute('aria-valuenow', '45');
  }
  await page.getByLabel('Unknown progress').check();
  for (const indicator of await indicators.all()) {
    await expect(indicator).not.toHaveAttribute('aria-valuenow');
  }
  await expect(page.locator('.mat-exp-progress-stop')).toHaveCount(0);
  await page.getByLabel('Unknown progress').uncheck();
  await page.getByLabel('Completed work:').fill('100');
  for (const indicator of await indicators.all()) {
    await expect(indicator).toHaveAttribute('aria-valuenow', '100');
    await expect(indicator.locator('.mat-exp-progress-track')).toHaveAttribute('d', '');
  }
});

test('live reduced-motion preference stops and resumes animations', async ({ page }) => {
  await page.getByLabel('Unknown progress').check();
  const active = page.locator('.mat-exp-progress-active').first();
  const still = await active.getAttribute('d');
  await page.waitForTimeout(150);
  expect(await active.getAttribute('d')).toBe(still);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => active.getAttribute('d')).not.toBe(still);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(active).toHaveAttribute('d', still!);
  await page.waitForTimeout(150);
  expect(await active.getAttribute('d')).toBe(still);
});

test('linear width responds without stretching wavelength; RTL mirrors only linear', async ({
  page,
}) => {
  const linear = page.locator('mat-exp-progress-indicator[data-variant="linear"]').first();
  await linear.evaluate((el) => {
    (el as HTMLElement).style.width = '180px';
    el.setAttribute('dir', 'rtl');
  });
  await expect(linear.locator('svg')).toHaveAttribute('viewBox', '0 0 180 10');
  const transform = await linear.locator('svg').evaluate((el) => getComputedStyle(el).transform);
  expect(transform).toBe('matrix(-1, 0, 0, 1, 0, 0)');
  const circular = page.locator('mat-exp-progress-indicator[data-variant="circular"]').first();
  await circular.evaluate((el) => el.setAttribute('dir', 'rtl'));
  expect(await circular.locator('svg').evaluate((el) => getComputedStyle(el).transform)).toBe(
    'none',
  );
});

test('forced colors replaces theme colors with system colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const active = page.locator('.mat-exp-progress-active').first();
  const track = page.locator('.mat-exp-progress-track').first();
  const activeColor = await active.evaluate((el) => getComputedStyle(el).stroke);
  const trackColor = await track.evaluate((el) => getComputedStyle(el).stroke);
  expect(activeColor).not.toBe('none');
  expect(trackColor).not.toBe('none');
  expect(activeColor).not.toBe(trackColor);
});
