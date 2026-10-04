import { expect, test } from '@playwright/test';

import { Lang, mockApi } from './fixtures/api-mock';

/**
 * NEW2B-5900: Copy link works on the plain-HTTP test server, where the
 * Clipboard API does not exist (insecure context). Simulated by removing
 * navigator.clipboard; the fallback must copy the page URL and say so.
 */
const SLUG = 'e2e-blog';
const blog = {
  id: 1, title: 'Leading hybrid teams', subtitle: null, slug: SLUG, image: null, level: null, reading_time: 4,
  qualifications: [], qualification: null, author: { name: 'NAS', image: null, is_anonymous: false }, added_by: null,
  published_at: '2026-09-20', created_at: '2026-09-20', author_user_id: null, is_anonymous: false, qualification_skill_ids: [],
  author_bio: null, sections: [{ id: 1, title: 'Intro', image: null, body: '<p>Text</p>', quote: null, sort_order: 1 }],
  love_count: 3, loved: false,
};

test.describe('copy link', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1440, 'behaviour test: desktop project only');

  for (const lang of ['en', 'ar'] as Lang[]) {
    test(`without the Clipboard API (${lang})`, async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
        const copied: string[] = [];
        (window as unknown as { __copied: string[] }).__copied = copied;
        document.execCommand = ((cmd: string) => {
          if (cmd !== 'copy') return false;
          const el = document.activeElement as HTMLTextAreaElement | null;
          copied.push(el?.value ?? '');
          return true;
        }) as typeof document.execCommand;
      });
      await mockApi(page, lang, [(path) => (path === `blogs/${SLUG}` ? blog : undefined)], false);
      await page.goto(`/blogs/${SLUG}`);

      await page.getByRole('button', { name: lang === 'en' ? 'Copy link' : /نسخ/ }).click();
      await expect(page.locator('.tst--success')).toHaveCount(1);
      const copied = await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied);
      expect(copied).toEqual([page.url()]);
    });
  }

  test('says so when copying is impossible', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
      document.execCommand = (() => false) as typeof document.execCommand;
    });
    await mockApi(page, 'en', [(path) => (path === `blogs/${SLUG}` ? blog : undefined)], false);
    await page.goto(`/blogs/${SLUG}`);
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.locator('.tst--error')).toHaveCount(1);
  });
});
