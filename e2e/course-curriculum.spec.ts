import { expect, test } from '@playwright/test';

import { Lang, mockApi, pageOverflowX } from './fixtures/api-mock';
import { course } from './fixtures/course-detail';

/**
 * Course detail › Curriculum tab (Figma 807:40170), against a mocked API:
 * the summary line, one row per session of the anchor cohort, and each
 * session's related contents from the cohort schedule sheet (D-079).
 */
const COPY = {
  en: { tab: 'Curriculum', summary: ['5 modules', '5 sessions total', '4 weeks duration'], four: '4 related contents', none: '0 related contents', empty: 'The session plan will appear here once a cohort is scheduled.' },
  ar: { tab: 'المنهج', summary: ['5 وحدات', '5 جلسات إجمالاً', 'المدة'], four: '4 محتويات مرتبطة', none: 'لا يوجد محتوى مرتبط', empty: 'ستظهر خطة الجلسات هنا بعد جدولة دفعة.' },
} as const;

for (const lang of ['en', 'ar'] as Lang[]) {
  test.describe(`Curriculum tab (${lang})`, () => {
    test('lists the sessions and expands one to its related contents', async ({ page }, info) => {
      await mockApi(page, lang, [(p) => (p === 'learner/academy/courses/6' ? course() : undefined)]);
      await page.goto('/catalogue/6');

      await page.getByRole('tab', { name: COPY[lang].tab }).click();
      await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

      const summary = page.locator('.curr-sum');
      for (const text of COPY[lang].summary) {
        await expect(summary).toContainText(text);
      }

      const rows = page.locator('.mitm');
      await expect(rows).toHaveCount(5);

      // A session without content is a plain row: no toggle, a zero badge.
      await expect(rows.nth(2).locator('button')).toHaveCount(0);
      await expect(rows.nth(2).locator('.mhd__count')).toHaveText(COPY[lang].none);

      const second = rows.nth(1).getByRole('button');
      await expect(second).toHaveAttribute('aria-expanded', 'false');
      await expect(second.locator('.mhd__count')).toHaveText(COPY[lang].four);
      await expect(second.locator('.mhd__name')).toHaveText(lang === 'en' ? 'Session 2' : 'الجلسة 2');
      await second.click();
      await expect(second).toHaveAttribute('aria-expanded', 'true');
      const items = rows.nth(1).locator('.mcontent__row');
      await expect(items).toHaveCount(4);
      await expect(items.nth(0)).toHaveText('Understanding team roles and strengths');
      await expect(items.nth(3)).toHaveText('Motivating diverse team members');
      await expect(rows.nth(1).locator('.mcontent__row img').first()).toHaveAttribute('alt', '');

      // Keyboard: Enter collapses it again.
      await second.focus();
      await page.keyboard.press('Enter');
      await expect(second).toHaveAttribute('aria-expanded', 'false');
      await expect(items).toHaveCount(0);

      expect(await pageOverflowX(page)).toBeLessThanOrEqual(0);
      await second.click();
      await page.screenshot({ path: `e2e-artifacts/course-curriculum-${lang}-${info.project.name}.png`, fullPage: true });
    });

    test('says so when no cohort is scheduled', async ({ page }) => {
      await mockApi(page, lang, [(p) => (p === 'learner/academy/courses/6' ? course(false) : undefined)]);
      await page.goto('/catalogue/6');
      await page.getByRole('tab', { name: COPY[lang].tab }).click();
      await expect(page.locator('.curr-empty')).toHaveText(COPY[lang].empty);
      await expect(page.locator('.curr-sum')).toContainText(COPY[lang].summary[0]);
    });
  });
}
