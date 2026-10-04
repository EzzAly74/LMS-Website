import { expect, test } from '@playwright/test';

import { Lang, mockApi } from './fixtures/api-mock';
import { course, sessions } from './fixtures/course-detail';

/**
 * Counts read right in both languages (pluralKey: Intl.PluralRules) and a
 * course nobody has rated says so instead of five empty stars and "0.0".
 * Course header, "This course includes" and the Instructor tab.
 */
type Case = { weeks: number; sessions: number; en: [string, string]; ar: [string, string] };
const CASES: Case[] = [
  { weeks: 1, sessions: 1, en: ['1 week', '1 live session'], ar: ['أسبوع واحد', 'جلسة مباشرة واحدة'] },
  { weeks: 2, sessions: 2, en: ['2 weeks', '2 live sessions'], ar: ['أسبوعان', 'جلستان مباشرتان'] },
  { weeks: 4, sessions: 5, en: ['4 weeks', '5 live sessions'], ar: ['4 أسابيع', '5 جلسات مباشرة'] },
  { weeks: 11, sessions: 12, en: ['11 weeks', '12 live sessions'], ar: ['11 أسبوعًا', '12 جلسة مباشرة'] },
];

function courseWith(weeks: number, sessionCount: number, rated: boolean) {
  const c = course();
  c.duration_weeks = weeks;
  const list = Array.from({ length: sessionCount }, (_, i) => ({ ...sessions[i % sessions.length], id: 100 + i }));
  if (c.anchor_cohort) c.anchor_cohort = { ...c.anchor_cohort, sessions: list };
  if (!rated) c.rating = { ...c.rating, avg: 0, count: 0 };
  return c;
}

test.describe('counts', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1440, 'text-only check: desktop project only');

  for (const lang of ['en', 'ar'] as Lang[]) {
    for (const k of CASES) {
      test(`${k.weeks} weeks / ${k.sessions} sessions (${lang})`, async ({ page }) => {
        await mockApi(page, lang, [(p) => (p === 'learner/academy/courses/6' ? courseWith(k.weeks, k.sessions, true) : undefined)]);
        await page.goto('/catalogue/6');
        const [weeks, live] = k[lang];
        await expect(page.locator('.detail-hero__stats')).toContainText(weeks);
        await expect(page.locator('.enrolment-card')).toContainText(live);
      });
    }
  }
});

for (const lang of ['en', 'ar'] as Lang[]) {
  test(`a course with no ratings says so (${lang})`, async ({ page }) => {
    await mockApi(page, lang, [(p) => (p === 'learner/academy/courses/6' ? courseWith(4, 5, false) : undefined)]);
    await page.goto('/catalogue/6');
    const rating = page.locator('.detail-hero__stats app-rating-stars');
    await expect(rating).toHaveText(lang === 'en' ? 'No ratings yet' : 'لا توجد تقييمات بعد');
    await expect(rating.locator('.pi-star')).toHaveCount(0);
    await expect(rating).not.toContainText('0.0');
  });
}
