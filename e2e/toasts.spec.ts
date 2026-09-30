import { expect, Page, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { API, Lang, mockApi, pageOverflowX } from './fixtures/api-mock';

/**
 * The one toast outlet (D-072), through real flows: a guest loving a blog
 * (an info toast: sign in first) and failing API calls (the error
 * interceptor), at every width in English and Arabic - the severity's
 * design and default title, the reading-end corner, duplicates collapsed,
 * Dismiss, and the countdown line (pauses on hover; gone with reduced
 * motion). The success design is covered by course-evaluation.spec.
 */
const ARTIFACTS = resolve(__dirname, '../e2e-artifacts/toasts');
const SLUG = 'e2e-blog';

const TEXT = {
  en: { info: 'For your information', wrong: 'Something went wrong', close: 'Dismiss notification' },
  ar: { info: 'للعلم', wrong: 'حدث خطأ ما', close: 'إغلاق الإشعار' },
} as const;

const blog = {
  id: 1, title: 'Leading hybrid teams', subtitle: null, slug: SLUG, image: null, level: null, reading_time: 4,
  qualifications: [], qualification: null, author: { name: 'NAS', image: null, is_anonymous: false }, added_by: null,
  published_at: '2026-09-20', created_at: '2026-09-20', author_user_id: null, is_anonymous: false, qualification_skill_ids: [],
  author_bio: null, sections: [{ id: 1, title: 'Intro', image: null, body: '<p>Text</p>', quote: null, sort_order: 1 }],
  love_count: 3, loved: false,
};

async function openBlog(page: Page, lang: Lang): Promise<void> {
  await mockApi(page, lang, [(path) => (path === `blogs/${SLUG}` ? blog : undefined)], false);
  await page.goto(`/blogs/${SLUG}`);
  await expect(page.locator('.blog-detail__act').first()).toBeVisible();
}

for (const lang of ['en', 'ar'] as Lang[]) {
  test(`info toast: design, corner, dismiss (${lang})`, async ({ page }, info) => {
    await openBlog(page, lang);
    await page.locator('.blog-detail__act').first().click(); // love, as a guest

    const toast = page.locator('.tst');
    await expect(toast).toHaveCount(1);
    await expect(toast).toHaveClass(/tst--info/);
    await expect(toast.locator('.tst__title')).toHaveText(TEXT[lang].info);
    await expect(toast.locator('.tst__detail')).not.toBeEmpty();
    await expect(toast.locator('.tst__detail')).not.toHaveText(/core\.|feature\./);
    await expect(page.getByRole('alert').filter({ has: toast })).toHaveCount(1);

    const box = (await toast.boundingBox())!;
    const width = page.viewportSize()!.width;
    expect(box.x).toBeGreaterThanOrEqual(15);
    expect(box.x + box.width).toBeLessThanOrEqual(width - 15);
    expect(box.y).toBeGreaterThanOrEqual(64); // clear of the header
    if (width > 560) {
      if (lang === 'en') expect(width - (box.x + box.width)).toBeLessThan(40);
      else expect(box.x).toBeLessThan(40);
    }
    expect(await pageOverflowX(page)).toBeLessThanOrEqual(1);
    await expect(toast.locator('.tst__progress')).toBeHidden(); // reduced motion (the suite's default)

    mkdirSync(ARTIFACTS, { recursive: true });
    await page.screenshot({ path: resolve(ARTIFACTS, `${info.project.name}-${lang}-info.png`) });

    await toast.getByRole('button', { name: TEXT[lang].close }).click();
    await expect(toast).toHaveCount(0);
  });
}

test.describe('behaviour', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1440, 'behaviour test: desktop project only');

  test('failing API calls: one error toast for identical failures', async ({ page }) => {
    await mockApi(page, 'en', [], false);
    // Registered after mockApi, so it answers first: every call fails the same way.
    await page.route(`${API}**`, r => r.fulfill({ status: 500, json: { status: 'error', message: 'Server exploded' } }));
    // The post and its related posts both fail: one toast, not two.
    await page.goto(`/blogs/${SLUG}`);

    const toast = page.locator('.tst--error');
    await expect(toast.first()).toBeVisible();
    await page.waitForTimeout(800);
    await expect(toast).toHaveCount(1);
    await expect(toast.locator('.tst__title')).toHaveText(TEXT.en.wrong);
    await expect(toast.locator('.tst__detail')).toHaveText('Server exploded');
    mkdirSync(ARTIFACTS, { recursive: true });
    await page.screenshot({ path: resolve(ARTIFACTS, 'desktop-1440-en-error.png'), clip: { x: 980, y: 0, width: 460, height: 220 } });
  });

  test('the countdown line runs and pauses on hover', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openBlog(page, 'en');
    await page.locator('.blog-detail__act').first().click();
    const line = page.locator('.tst__progress');
    await expect(line).toBeVisible();
    const state = () => line.evaluate(el => el.getAnimations()[0]?.playState ?? 'none');
    expect(await state()).toBe('running');
    await page.locator('.tst').hover();
    await expect.poll(state).toBe('paused');
    await page.mouse.move(10, 500);
    await expect.poll(state).toBe('running');
    await page.waitForTimeout(400);
    await page.screenshot({ path: resolve(ARTIFACTS, 'desktop-1440-en-info-motion.png'), clip: { x: 980, y: 0, width: 460, height: 220 } });
    // Info lives 5 s.
    await expect(page.locator('.tst')).toHaveCount(0, { timeout: 8000 });
  });
});
