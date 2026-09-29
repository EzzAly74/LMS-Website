import { expect, test } from '@playwright/test';

import { Lang, mockApi, pageOverflowX } from './fixtures/api-mock';
import { course } from './fixtures/course-detail';

/** Course detail › Schedule tab (Figma 2027:97810), against a mocked API. */

for (const lang of ['en', 'ar'] as Lang[]) {
  test.describe(`Schedule tab (${lang})`, () => {
    test('lists every session with its status, and the seats row', async ({ page }, info) => {
      await mockApi(page, lang, [(p) => (p === 'learner/academy/courses/6' ? course() : undefined)]);
      await page.goto('/catalogue/6');

      const tab = page.getByRole('tab', { name: lang === 'en' ? 'Schedule' : 'الجدول' });
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

      const wide = (page.viewportSize()?.width ?? 0) >= 1440;
      if (wide) {
        const rows = page.locator('.schedule__table tbody tr');
        await expect(rows).toHaveCount(5);
        await expect(page.locator('.schedule__list')).toBeHidden();
        await expect(rows.nth(0)).toContainText(lang === 'en' ? 'Session 1' : 'الجلسة 1');
        await expect(rows.nth(0)).toContainText('09:00');
        await expect(rows.nth(0)).toContainText(lang === 'en' ? '2h 30m' : '2 س 30 د');
        await expect(rows.nth(0).locator('.schedule__status--done')).toHaveText(lang === 'en' ? 'Completed' : 'مكتملة');
        await expect(rows.nth(4)).toContainText(lang === 'en' ? '2h' : '2 س');
        await expect(rows.nth(3)).toContainText('—'); // no location stored
      } else {
        const items = page.locator('.schedule__item');
        await expect(items).toHaveCount(5);
        await expect(page.locator('.schedule__table-wrap')).toBeHidden();
        await expect(items.nth(2).locator('.schedule__pill')).toHaveText(lang === 'en' ? 'Upcoming' : 'قادمة');
        await expect(items.nth(0)).toContainText('09:00 - 11:30');
      }

      const seats = page.locator('.seats-row');
      await expect(seats).toContainText(lang === 'en' ? '8 Left' : 'متبقٍ 8');
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80');

      expect(await pageOverflowX(page)).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `e2e-artifacts/course-schedule-${lang}-${info.project.name}.png`, fullPage: true });
    });

    test('says so when no session is scheduled', async ({ page }) => {
      await mockApi(page, lang, [(p) => (p === 'learner/academy/courses/6' ? course(false) : undefined)]);
      await page.goto('/catalogue/6');
      await page.getByRole('tab', { name: lang === 'en' ? 'Schedule' : 'الجدول' }).click();
      await expect(page.locator('.schedule__empty')).toBeVisible();
    });
  });
}
