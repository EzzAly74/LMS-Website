import { expect, Page, test } from '@playwright/test';

import { Lang, mockApi, pageOverflowX } from './fixtures/api-mock';

/**
 * NEW2B-5780: Profile > Qualifications "Notify me when the next cohort opens"
 * did nothing. It now asks for every not-yet-earned course of that
 * qualification and then says the learner will be told; after a reload the
 * API's notify_requested keeps that state. EN + AR at every width.
 */
const qual = (requested: boolean) => ({
  id: 3, name: 'Team Leadership', total_courses: 2, completed_courses: 0, percent: 0, earned_courses: [],
  uncovered_courses: [
    { course_id: 8, title: 'Management Course', cohort_scheduled: false, notify_requested: requested, also_in: [] },
    { course_id: 6, title: 'First Course', cohort_scheduled: true, notify_requested: requested, also_in: [] },
  ],
});

async function open(page: Page, lang: Lang, requested: boolean): Promise<number[]> {
  await mockApi(page, lang, [
    (p) => (p === 'learner/profile/summary'
      ? { learner: { id: 25, machine_code: '2394', name: 'Ezz Eldin', email: null, image: null, department_name: null, job_title: null, learner_type: null },
          counts: { required: 2, earned: 0, in_progress: 0, not_started: 2 } }
      : undefined),
    (p) => (p === 'learner/profile/qualifications' ? [qual(requested)] : undefined),
    (p) => (p === 'learner/profile/learnings' ? [] : undefined),
    (p) => (p === 'learner/profile/schedule' ? { range: { start: '2026-10-04', end: '2026-10-10' }, sessions: [] } : undefined),
  ]);
  const posted: number[] = [];
  await page.route('**/learner/academy/courses/*/notify-me', (route) => {
    posted.push(Number(route.request().url().split('/courses/')[1].split('/')[0]));
    return route.fulfill({ json: { status: 'success', message: '', result: null } });
  });
  await page.goto('/profile');
  await page.getByRole('tab', { name: lang === 'en' ? /Qualifications/ : /المؤهلات/ }).click();
  await page.locator('.qual-card__header').first().click();
  return posted;
}

for (const lang of ['en', 'ar'] as Lang[]) {
  test(`notify me asks for each course and confirms (${lang})`, async ({ page }, info) => {
    const posted = await open(page, lang, false);
    const button = page.locator('button.qual-section__notify');
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => posted.sort()).toEqual([6, 8]);
    await expect(page.locator('.qual-section__notify--done')).toHaveAttribute('role', 'status');
    await expect(page.locator('button.qual-section__notify')).toHaveCount(0);
    await expect(page.locator('.tst--success')).toHaveCount(1);
    expect(await pageOverflowX(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `e2e-artifacts/qualification-notify-${lang}-${info.project.name}.png`, fullPage: true });
  });

  test(`already requested shows the waiting state (${lang})`, async ({ page }) => {
    const posted = await open(page, lang, true);
    await expect(page.locator('.qual-section__notify--done')).toBeVisible();
    await expect(page.locator('button.qual-section__notify')).toHaveCount(0);
    expect(posted).toEqual([]);
  });
}
