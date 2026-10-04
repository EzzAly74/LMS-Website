import { expect, Page, test } from '@playwright/test';

import { Lang, mockApi, pageOverflowX } from './fixtures/api-mock';

/**
 * Blog listing and cards as in Figma 1589:45934 / 1589:46006 / 1589:46827:
 * NEW2B-5873 (card), 5881 + 5896 (read minutes on cards and related
 * articles), 5887 (two chips then "+N" on one line), 5893 (spacing).
 */
const q = (id: number, name: string) => ({ id, name });
const post = (id: number, over: Record<string, unknown> = {}) => ({
  id, title: 'Design Systems: From Component Libraries to Culture that improves our', subtitle:
    'Exploring the shifting landscape of contemporary practices through a critical lens of sustainability and human-centered ethics.',
  slug: `b${id}`, image: null, level: (['beginner', 'intermediate', 'professional'] as const)[id % 3], reading_time: 8,
  qualifications: [q(1, 'Project Management'), q(2, 'PMP Preparation')], qualification: q(1, 'Project Management'),
  author: { name: 'Omar Nassar', image: null, is_anonymous: false }, added_by: null,
  published_at: '2026-10-12', created_at: '2026-10-12', love_count: 0, loved: false, ...over,
});
const LIST = [
  post(1, { title: 'The Future of Cognitive Load: How We Adapt to Information Density', reading_time: 12 }),
  post(2, { qualifications: [q(3, 'Excel course for professional purposes and special'), q(1, 'Project Management'), q(2, 'PMP Preparation'), q(4, 'HSE Compliance')] }),
  post(3, { reading_time: 1 }),
  post(4),
  post(5, { reading_time: null }),
  post(6),
];

async function list(page: Page, lang: Lang): Promise<void> {
  await mockApi(page, lang, [], false);
  await page.route(/\/api\/v1\/blogs(\?.*)?$/, (r) => r.fulfill({ json: { status: 'success', message: '', result: LIST,
    meta: { current_page: 1, last_page: 1, per_page: 12, total: LIST.length } } }));
  await page.goto('/blogs');
  await expect(page.locator('app-blog-card')).toHaveCount(LIST.length - 1); // the first is the hero
}

for (const lang of ['en', 'ar'] as Lang[]) {
  test(`cards: read minutes, chips + N, clamped text (${lang})`, async ({ page }, info) => {
    await list(page, lang);
    const cards = page.locator('app-blog-card');

    // Read minutes (5881); none when the blog has no reading time.
    await expect(cards.nth(0).locator('.blog-card__read')).toHaveText(lang === 'en' ? '8 min read' : '8 دقائق قراءة');
    await expect(cards.nth(1).locator('.blog-card__read')).toHaveText(lang === 'en' ? '1 min read' : 'دقيقة قراءة واحدة');
    await expect(cards.nth(3).locator('.blog-card__read')).toHaveCount(0);

    // Two chips then "+2", on one line (5887).
    const topics = cards.nth(0).locator('.blog-card__topics');
    await expect(topics.locator('.blog-card__topic')).toHaveCount(2);
    await expect(topics.locator('.blog-card__more')).toHaveText('+2');
    const box = (await topics.boundingBox())!;
    expect(box.height).toBeLessThan(26);

    // Title and excerpt never pass two lines.
    for (const sel of ['.blog-card__title a', '.blog-card__excerpt']) {
      const h = await cards.nth(0).locator(sel).evaluate((el) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
      expect(h).toBeLessThanOrEqual(2.05);
    }

    // Figma 1440: 316 px cards, 14 px apart (5873 / 5893).
    if ((page.viewportSize()?.width ?? 0) >= 1440) {
      const a = (await cards.nth(0).boundingBox())!;
      const b = (await cards.nth(1).boundingBox())!;
      expect(Math.round(a.width)).toBe(316);
      expect(Math.round(Math.abs(b.x - a.x) - a.width)).toBe(14);
    }
    expect(await pageOverflowX(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `e2e-artifacts/blog-cards-${lang}-${info.project.name}.png`, fullPage: true });
  });
}

test('related articles show the read minutes (5896)', async ({ page }) => {
  const detail = { ...post(9), sections: [{ id: 1, title: 'Intro', image: null, body: '<p>Text</p>', quote: null, sort_order: 1 }],
    author_bio: null, author_user_id: null, is_anonymous: false, qualification_skill_ids: [] };
  await mockApi(page, 'en', [
    (p) => (p === 'blogs/b9' ? detail : undefined),
    (p) => (p === 'blogs/b9/related' ? [post(10, { reading_time: 6 })] : undefined),
  ], false);
  await page.goto('/blogs/b9');
  await expect(page.locator('app-blog-card .blog-card__read')).toHaveText('6 min read');
});
