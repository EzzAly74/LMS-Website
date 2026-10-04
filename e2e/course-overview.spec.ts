import { expect, test } from '@playwright/test';

import { Lang, mockApi, pageOverflowX } from './fixtures/api-mock';
import { course } from './fixtures/course-detail';

/**
 * Overview tab "Qualifications earned" (Figma 966:49784; NEW2B-5917) and the
 * header chip / "Earns:" tags (818:40243): rows with the teal award tile,
 * readable at every width in EN and AR.
 */
for (const lang of ['en', 'ar'] as Lang[]) {
  test(`qualifications earned and header tags (${lang})`, async ({ page }, info) => {
    const c = { ...course(), qualifications: [{ id: 1, name: 'Leadership & Management' }, { id: 2, name: 'Team Leadership' }] };
    await mockApi(page, lang, [(p) => (p === 'learner/academy/courses/6' ? c : undefined)]);
    await page.goto('/catalogue/6');

    const rows = page.locator('.qualification-list__item');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator('.qualification-list__icon img')).toHaveAttribute('src', /award-16\.svg$/);
    await expect(rows.nth(0)).toHaveCSS('border-radius', '12px');
    await expect(page.locator('.detail-hero__qtag')).toHaveText(['Leadership & Management', 'Team Leadership']);
    // Tag text keeps AA contrast (sky-900, not the drawn #58a7bf).
    await expect(page.locator('.detail-hero__qtag').first()).toHaveCSS('color', 'rgb(53, 100, 115)');
    await expect(page.locator('.detail-hero__eyebrow img')).toHaveAttribute('src', /stack-chip-10\.svg$/);

    expect(await pageOverflowX(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `e2e-artifacts/course-overview-${lang}-${info.project.name}.png`, fullPage: true });
  });
}
