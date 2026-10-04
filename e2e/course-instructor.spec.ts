import { expect, test } from '@playwright/test';

import { Lang, mockApi, pageOverflowX } from './fixtures/api-mock';
import { course } from './fixtures/course-detail';

/**
 * Course detail › Instructor tab (Figma 818:40243, phone 966:50318;
 * NEW2B-5926): title, rating / learners / courses, bio, other courses that
 * open their own course page. Every width, EN + AR, against a mocked API.
 */
const TEXT = {
  en: { tab: 'Instructor', learners: '1,204 learners', courses: '3 courses', rating: '4.8 rating', other: 'Other courses by Sara' },
  ar: { tab: 'المدرّب', learners: '1,204 متدربين', courses: '3 دورات', rating: 'تقييم 4.8', other: 'دورات أخرى للمدرب Sara' },
} as const;

for (const lang of ['en', 'ar'] as Lang[]) {
  test(`Instructor tab: title, stats, other courses (${lang})`, async ({ page }, info) => {
    const other = { ...course(), id: 7, title: 'Communication & Presentation Skills' };
    await mockApi(page, lang, [(p) => (p === 'learner/academy/courses/6' ? course() : p === 'learner/academy/courses/7' ? other : undefined)]);
    await page.goto('/catalogue/6');

    await page.getByRole('tab', { name: TEXT[lang].tab }).click();
    const card = page.locator('.instructor-card');
    await expect(card.locator('.instructor-card__title')).toHaveText('Senior Learning & Development Specialist');
    await expect(card.locator('.instructor-card__stats li')).toHaveText([TEXT[lang].rating, TEXT[lang].learners, TEXT[lang].courses]);
    await expect(page.locator('.instructor-bio')).toContainText('12 years');

    const section = page.getByRole('region', { name: TEXT[lang].other });
    await expect(section).toBeVisible();
    const rows = section.getByRole('link');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toHaveAttribute('href', '/catalogue/7');
    await expect(rows.nth(1).locator('.mini-course__name')).toContainText('deliberately long');

    // Nothing spills out of the tab at any width; the long title wraps.
    const tab = (await page.locator('.instructor-other').boundingBox())!;
    for (let i = 0; i < 2; i++) {
      const b = (await rows.nth(i).boundingBox())!;
      expect(b.x >= tab.x - 1 && b.x + b.width <= tab.x + tab.width + 1).toBe(true);
    }
    expect(await pageOverflowX(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `e2e-artifacts/course-instructor-${lang}-${info.project.name}.png`, fullPage: true });

    // Opening another course loads it and goes back to Overview.
    await rows.nth(0).click();
    await expect(page).toHaveURL(/\/catalogue\/7$/);
    await expect(page.locator('h1')).toContainText('Communication & Presentation Skills');
    await expect(page.getByRole('tab', { name: TEXT[lang].tab })).toHaveAttribute('aria-selected', 'false');
  });
}

test('an instructor with no title, rating or other courses shows only what exists', async ({ page }) => {
  const bare = course();
  bare.instructors = [{ ...bare.instructors[0], title: null, rating_avg: null, rating_count: 0, learners_count: 0, courses_count: 1, other_courses: [] }];
  await mockApi(page, 'en', [(p) => (p === 'learner/academy/courses/6' ? bare : undefined)]);
  await page.goto('/catalogue/6');
  await page.getByRole('tab', { name: 'Instructor' }).click();

  await expect(page.locator('.instructor-card__title')).toHaveCount(0);
  await expect(page.locator('.instructor-card__stats li')).toHaveText(['0 learners', '1 course']);
  await expect(page.locator('.instructor-other')).toHaveCount(0);
});
