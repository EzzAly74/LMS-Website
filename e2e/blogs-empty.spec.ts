import { expect, Page, test } from '@playwright/test';

import { Lang, mockApi, pageOverflowX } from './fixtures/api-mock';

/**
 * Blogs listing (human, 2026-10-04): with no blogs at all, the title, search
 * and scope toggle are not shown, only the empty state. A search, filter or
 * Tailored scope that finds nothing keeps them, with a "no match" message,
 * so the learner can change it. EN + AR at every width. Mocked API.
 */
const blog = {
  id: 1, title: 'Leading hybrid teams', subtitle: null, slug: 'b1', image: null, level: 'beginner', reading_time: 4,
  qualifications: [], qualification: null, author: { name: 'NAS', image: null, is_anonymous: false },
  published_at: '2026-09-20', created_at: '2026-09-20', love_count: 0, loved: false,
};
const TEXT = {
  en: { none: 'No blogs yet', noMatch: 'No blogs match', search: 'Search blogs' },
  ar: { none: 'لا توجد مدونات بعد', noMatch: 'لا توجد مدونات مطابقة', search: 'المدونات' },
} as const;

async function open(page: Page, lang: Lang, signedIn: boolean, list: (url: URL) => unknown[]): Promise<void> {
  await mockApi(page, lang, [], signedIn);
  await page.route(/\/api\/v1\/blogs(\?.*)?$/, (route) => {
    const rows = list(new URL(route.request().url()));
    return route.fulfill({ json: { status: 'success', message: '', result: rows, meta: { current_page: 1, last_page: 1, per_page: 12, total: rows.length } } });
  });
  await page.goto('/blogs');
}

for (const lang of ['en', 'ar'] as Lang[]) {
  test(`no blogs at all: no header, only the empty state (${lang})`, async ({ page }, info) => {
    await open(page, lang, false, () => []);
    await expect(page.locator('app-empty-state')).toContainText(TEXT[lang].none);
    await expect(page.locator('.blogs__header')).toHaveCount(0);
    expect(await pageOverflowX(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `e2e-artifacts/blogs-empty-${lang}-${info.project.name}.png`, fullPage: true });
  });

  test(`a search that finds nothing keeps the search (${lang})`, async ({ page }) => {
    await open(page, lang, false, (url) => (url.searchParams.get('search') ? [] : [blog, { ...blog, id: 2, slug: 'b2' }]));
    await expect(page.locator('.blogs__header')).toBeVisible();
    const search = page.locator('.blogs__search input');
    await search.fill('zzz-nothing');
    await search.press('Enter');
    await expect(page.locator('app-empty-state')).toContainText(TEXT[lang].noMatch);
    await expect(page.locator('.blogs__header')).toBeVisible();
    await expect(search).toHaveValue('zzz-nothing');

    // Clearing it brings the blogs back.
    await search.fill('');
    await search.press('Enter');
    await expect(page.locator('app-empty-state')).toHaveCount(0);
  });

  test(`Tailored with nothing keeps the scope toggle (${lang})`, async ({ page }) => {
    await open(page, lang, true, (url) => (url.searchParams.get('scope') === 'tailored' ? [] : [blog]));
    await expect(page.locator('.blogs__header app-toggle-tabs')).toBeVisible();
    await page.locator('.blogs__header app-toggle-tabs button').first().click();
    await expect(page.locator('app-empty-state')).toContainText(TEXT[lang].noMatch);
    await expect(page.locator('.blogs__header app-toggle-tabs')).toBeVisible();
  });
}
