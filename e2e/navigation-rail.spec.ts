import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Expressive navigation rail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/components/navigation/navigation-rail');
    await page.locator('mat-exp-navigation-rail').waitFor();
    await page.locator('app-navigation-rail-playground').scrollIntoViewIfNeeded();
  });

  test('standard dimensions, full-width targets, secondary destinations, and independent scrolling', async ({
    page,
  }) => {
    const rail = page.locator('mat-exp-navigation-rail');
    const panel = rail.locator('mat-drawer');
    const item = rail.getByRole('button', { name: 'Inbox, 3 unread messages' });
    await expect.poll(async () => (await panel.boundingBox())!.width).toBe(96);
    await expect.poll(async () => (await item.boundingBox())!.width).toBe(96);
    await expect(item).toHaveAttribute('aria-current', 'page');
    await expect(rail.getByRole('button', { name: 'Archive', exact: true })).toHaveCount(0);
    const icon = item.locator('.mat-exp-navigation-rail-item-icon');
    expect((await icon.boundingBox())!.width).toBe(56);
    expect((await icon.boundingBox())!.height).toBe(32);
    await rail.getByRole('button', { name: 'Expand navigation' }).click();
    await expect.poll(async () => (await panel.boundingBox())!.width).toBe(220);
    await expect(rail.getByRole('button', { name: 'Archive', exact: true })).toBeVisible();
    const indicator = item.locator('.mat-exp-navigation-rail-item-container');
    expect((await indicator.boundingBox())!.height).toBe(56);
    expect((await indicator.boundingBox())!.width).toBeLessThan(220);
    const contentBox = (await rail.locator('mat-drawer-content').boundingBox())!;
    expect(Math.abs(contentBox.x - (await panel.boundingBox())!.x - 220)).toBeLessThan(1);
    await expect(rail.locator('mat-drawer-content')).not.toHaveAttribute('inert');
    const before = (await item.boundingBox())!.y;
    await rail.locator('mat-drawer-content').evaluate((el) => {
      const filler = document.createElement('div');
      filler.style.height = '2000px';
      el.append(filler);
      el.scrollTop = 500;
    });
    expect((await item.boundingBox())!.y).toBe(before);
  });

  test('arrows move focus without selecting; Space activates and Tab leaves standard navigation', async ({
    page,
  }) => {
    const rail = page.locator('mat-exp-navigation-rail');
    const inbox = rail.getByRole('button', { name: 'Inbox, 3 unread messages' });
    const sent = rail.getByRole('button', { name: 'Sent', exact: true });
    const drafts = rail.getByRole('button', { name: 'Drafts', exact: true });
    await inbox.focus();
    await page.keyboard.press('ArrowDown');
    await expect(sent).toBeFocused();
    await expect(inbox).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('End');
    await expect(drafts).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(inbox).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(drafts).toBeFocused();
    await page.keyboard.press('Space');
    await expect(drafts).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Tab');
    await expect(rail.getByRole('button', { name: 'Return to inbox' })).toBeFocused();
  });

  for (const hidden of [false, true]) {
    test(`modal traps/restores focus and preserves content position (hidden=${hidden})`, async ({
      page,
    }) => {
      await page.getByLabel('Expanded layout').selectOption('modal');
      if (hidden) await page.getByLabel('Hide when collapsed').check();
      const rail = page.locator('mat-exp-navigation-rail');
      const opener = rail.getByRole('button', {
        name: hidden ? 'Open navigation' : 'Expand navigation',
        exact: true,
      });
      const content = rail.locator('mat-drawer-content');
      await expect
        .poll(async () =>
          parseFloat(await content.evaluate((el) => getComputedStyle(el).marginInlineStart)),
        )
        .toBe(hidden ? 0 : 96);
      const before = (await content.boundingBox())!.x;
      await opener.click();
      const close = rail.getByRole('button', { name: 'Collapse navigation' });
      await expect(close).toBeFocused();
      await expect(rail.getByRole('dialog', { name: 'Mailbox' })).toBeVisible();
      await expect(content).toHaveAttribute('inert', '');
      await expect.poll(async () => (await content.boundingBox())!.x).toBe(before);
      await page.keyboard.press('Shift+Tab');
      await expect(rail.getByRole('button', { name: 'Archive', exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(close).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(opener).toBeFocused();
      await expect(rail).toHaveAttribute('data-expanded', 'false');
      if (hidden) await expect(rail.locator('mat-drawer')).toHaveAttribute('aria-hidden', 'true');
      await opener.click();
      await rail.locator('.mat-drawer-backdrop').click({ position: { x: 500, y: 100 } });
      await expect(rail).toHaveAttribute('data-expanded', 'false');
      await expect(opener).toBeFocused();
    });
  }

  test('hidden standard expansion reserves space and reveals a named section', async ({ page }) => {
    await page.getByLabel('Hide when collapsed').check();
    const rail = page.locator('mat-exp-navigation-rail');
    const content = rail.locator('mat-drawer-content');
    await expect
      .poll(() => content.evaluate((el) => parseFloat(getComputedStyle(el).marginInlineStart)))
      .toBe(0);
    await rail.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await expect
      .poll(() => content.evaluate((el) => parseFloat(getComputedStyle(el).marginInlineStart)))
      .toBe(220);
    await expect(rail.getByRole('group', { name: 'Library' })).toBeVisible();
    await expect(content).not.toHaveAttribute('inert');
    await rail.getByRole('button', { name: 'Collapse navigation' }).click();
    await expect.poll(async () => (await rail.locator('mat-drawer').boundingBox())!.width).toBe(0);
    await expect(rail.getByRole('button', { name: 'Open navigation', exact: true })).toBeFocused();
  });

  test('modal destination selection closes and mode changes release the trap', async ({ page }) => {
    const rail = page.locator('mat-exp-navigation-rail');
    await page.getByLabel('Expanded layout').selectOption('modal');
    await rail.getByRole('button', { name: 'Expand navigation' }).click();
    await rail.getByRole('button', { name: 'Sent', exact: true }).click();
    await expect(rail).toHaveAttribute('data-expanded', 'false');
    await expect(rail.getByRole('heading', { name: 'Sent' })).toBeVisible();
    await rail.getByRole('button', { name: 'Expand navigation' }).click();
    await page.getByLabel('Expanded layout').selectOption('standard');
    await expect(rail.locator('mat-drawer-content')).not.toHaveAttribute('inert');
    await rail.getByRole('button', { name: 'Archive', exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(rail.getByRole('button', { name: 'Return to inbox' })).toBeFocused();
  });

  test('RTL anchors to the leading edge and centers only destinations', async ({ page }) => {
    await page.getByLabel('RTL', { exact: true }).check();
    const rail = page.locator('mat-exp-navigation-rail');
    const panel = rail.locator('mat-drawer');
    await expect
      .poll(async () => {
        const r = (await rail.boundingBox())!;
        const p = (await panel.boundingBox())!;
        return Math.round(p.x + p.width - r.x - r.width);
      })
      .toBe(0);
    const menu = rail.getByRole('button', { name: 'Expand navigation' });
    const menuY = (await menu.boundingBox())!.y;
    const item = rail.getByRole('button', { name: 'Inbox, 3 unread messages' });
    const itemY = (await item.boundingBox())!.y;
    await page.getByLabel('Center destinations').check();
    expect((await menu.boundingBox())!.y).toBe(menuY);
    expect((await item.boundingBox())!.y).toBeGreaterThan(itemY);
  });

  test('full labels remain visible at 200% text size', async ({ page }) => {
    const rail = page.locator('mat-exp-navigation-rail');
    await rail.locator('.mat-exp-navigation-rail-item-label').evaluateAll((elements) => {
      elements.forEach((el) => {
        const e = el as HTMLElement;
        e.style.fontSize = '24px';
        e.style.lineHeight = '32px';
      });
    });
    for (const expanded of [false, true]) {
      if (expanded) await rail.getByRole('button', { name: 'Expand navigation' }).click();
      await expect
        .poll(async () => (await rail.locator('mat-drawer').boundingBox())!.width)
        .toBe(expanded ? 220 : 96);
      const labels = rail.locator(
        '.mat-exp-navigation-rail-item:not([hidden]) .mat-exp-navigation-rail-item-label',
      );
      for (const label of await labels.all()) {
        expect(
          await label.evaluate(
            (el) => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight,
          ),
        ).toBe(true);
      }
    }
  });

  test('reduced motion reaches its final layout immediately and rapid toggles settle', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const rail = page.locator('mat-exp-navigation-rail');
    await rail.getByRole('button', { name: 'Expand navigation' }).click();
    expect((await rail.locator('mat-drawer').boundingBox())!.width).toBe(220);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (let i = 0; i < 4; i++)
      await rail.locator('[matExpNavigationRailHeader] button').first().click();
    await expect
      .poll(async () => (await rail.locator('mat-drawer').boundingBox())!.width)
      .toBe(220);
  });

  test('motion stays local after page scrolling and responds to reduced motion mid-transition', async ({
    page,
  }) => {
    const rail = page.locator('mat-exp-navigation-rail');
    await rail.getByRole('button', { name: 'Expand navigation' }).click();
    const panel = rail.locator('mat-drawer');
    await expect
      .poll(() => panel.evaluate((el) => (el as HTMLElement).style.inlineSize !== ''))
      .toBe(true);
    const panelBox = (await panel.boundingBox())!;
    const iconBox = (await rail
      .locator('.mat-exp-navigation-rail-item-icon')
      .first()
      .boundingBox())!;
    expect(iconBox.y).toBeGreaterThanOrEqual(panelBox.y);
    expect(iconBox.y + iconBox.height).toBeLessThanOrEqual(panelBox.y + panelBox.height);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => panel.evaluate((el) => (el as HTMLElement).style.inlineSize)).toBe('');
    expect((await panel.boundingBox())!.width).toBe(220);
  });

  for (const dark of [false, true]) {
    test(`axe accessibility for collapsed, standard, and modal (dark=${dark})`, async ({
      page,
    }) => {
      if (dark) await page.locator('html').evaluate((el) => el.classList.add('dark'));
      const rail = page.locator('mat-exp-navigation-rail');
      for (const state of ['collapsed', 'standard', 'modal']) {
        if (state === 'standard')
          await rail.getByRole('button', { name: 'Expand navigation' }).click();
        if (state === 'modal') await page.getByLabel('Expanded layout').selectOption('modal');
        await expect
          .poll(async () => (await rail.locator('mat-drawer').boundingBox())!.width)
          .toBe(state === 'collapsed' ? 96 : 220);
        await expect
          .poll(() =>
            rail.locator('mat-drawer').evaluate((el) => (el as HTMLElement).style.inlineSize),
          )
          .toBe('');
        const results = await new AxeBuilder({ page })
          .include('app-navigation-rail-playground')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      }
    });
  }
});
