import { expect, test } from '@playwright/test';

import { Lang, mockApi, pageOverflowX } from './fixtures/api-mock';

/**
 * NEW2B-5914: each course level has its own badge colour (Figma 818:40686):
 * Beginner sky, Intermediate orange, Professional green, text darkened for AA.
 */
const card = (id: number, level: string) => ({
  id, title: `Course ${id}`, description: '', course_type: 'online', level, duration_weeks: 4, image: null, hours: 12,
  has_certificate: true, category: null, instructors: [{ id: 1, name: 'Sara Al-Mansouri', image: null }], qualifications: [],
  rating: { avg: 4.5, count: 10, sentiment: 'positive' },
  next_cohort: { id: 9, name: 'A', start_date: '2026-11-01', end_date: '2026-11-29', capacity: 30, enrolled_count: 1, seats_left: 29,
    enrolment_closes_at: null, days_until_deadline: 20, days_until_start: 28, deadline_severity: 'none' },
  cta: { state: 'enrol_now', label_key: 'enums.course_cta_state.enrol_now', enabled: true },
});

const COLOURS = {
  beginner: 'rgb(53, 100, 115)',     // sky-900
  intermediate: 'rgb(168, 94, 5)',   // orange-800
  professional: 'rgb(10, 125, 72)',  // green-700
} as const;

for (const lang of ['en', 'ar'] as Lang[]) {
  test(`level badges use the level colour (${lang})`, async ({ page }, info) => {
    await mockApi(page, lang, [(p) => (p === 'learner/academy/courses'
      ? [card(1, 'beginner'), card(2, 'intermediate'), card(3, 'professional')]
      : undefined)]);
    await page.goto('/catalogue');
    const badges = page.locator('.course-card .badge--level');
    await expect(badges).toHaveCount(3);
    for (const [i, level] of (['beginner', 'intermediate', 'professional'] as const).entries()) {
      await expect(badges.nth(i)).toHaveClass(new RegExp(`badge--level-${level}`));
      await expect(badges.nth(i)).toHaveCSS('color', COLOURS[level]);
    }
    expect(await pageOverflowX(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `e2e-artifacts/level-badges-${lang}-${info.project.name}.png` });
  });
}
