import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { Lang, mockApi, pageOverflowX } from './fixtures/api-mock';

/**
 * My Learnings "Completed" tab: a course the learner rated shows "My Rating"
 * (set by the course evaluation, human 2026-09-30); an unrated one shows none.
 * Mocked API in the real learner/profile/completed shape.
 */

const ARTIFACTS = resolve(__dirname, '../e2e-artifacts/completed-rating');

const completed = (id: number, title: string, rate: number | null, label: string | null) => ({
  kind: 'course', course_id: id, title, image: null, course_type: 'hybrid', completed_at: '2026-09-29',
  score_percent: null, certificate_id: null, certificate_earned: false, certificate_offered: false,
  rate, rate_label: label,
});

for (const lang of ['en', 'ar'] as const) {
  test(`completed courses show My Rating ${lang}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await mockApi(page, lang as Lang, [
      (path) => (path === 'learner/profile/summary'
        ? { learner: { id: 9001, machine_code: null, name: 'Huda Atef', email: null, image: null, department_name: 'Human Resources', job_title: null, learner_type: null },
            counts: { required: 7, earned: 2, in_progress: 3, not_started: 2 } }
        : undefined),
      (path) => (path === 'learner/profile/learnings' ? [] : undefined),
      (path) => (path === 'learner/profile/schedule' ? { range: { start: '2026-09-27', end: '2026-10-03' }, sessions: [] } : undefined),
      (path) => (path === 'learner/profile/completed'
        ? [
            completed(8, lang === 'ar' ? 'كورس الإدارة' : 'Management Course', 4, lang === 'ar' ? 'راضٍ' : 'Satisfied'),
            completed(9, lang === 'ar' ? 'أساسيات إكسل' : 'Excel Basics', null, null),
          ]
        : undefined),
    ]);
    await page.goto('/profile');
    await page.getByRole('tab', { name: lang === 'ar' ? /تعلّم|تعلم/ : /My Learnings/ }).click();
    await page.getByRole('tab', { name: lang === 'ar' ? 'المكتملة' : 'Completed' }).click();

    const rows = page.locator('.ml-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator('.ml-row__rating')).toHaveText(
      lang === 'ar' ? /تقييمي:\s*4\s*\(راضٍ\)/ : /My Rating:\s*4\s*\(Satisfied\)/,
    );
    await expect(rows.nth(1).locator('.ml-row__rating')).toHaveCount(0); // not rated
    expect(await pageOverflowX(page)).toBeLessThanOrEqual(1);

    mkdirSync(ARTIFACTS, { recursive: true });
    await rows.nth(0).screenshot({ path: resolve(ARTIFACTS, `${info.project.name}-${lang}.png`) });
    const text = await page.locator('body').innerText();
    expect(text.match(/\bfeature\.[a-z_.]+/g) ?? []).toEqual([]);
    expect(errors).toEqual([]);
  });
}
