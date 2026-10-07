import { expect, Page, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { API, Lang, mockApi, pageOverflowX } from './fixtures/api-mock';

/**
 * Book a Demo (/request-demo):
 * - NEW2B-5867: an address the server cannot mail (`name@domain`) is a field
 *   error, for the requester and every guest, announced and tied to the input;
 *   a server 422 lands on the field it names, with no extra toast;
 * - NEW2B-5898: guests are sent (trimmed, blanks dropped) so the server can
 *   invite them.
 * At every width in English and Arabic. Mocked API.
 */
const ARTIFACTS = resolve(__dirname, '../e2e-artifacts/book-demo');

const TEXT = {
  en: { email: 'Enter a valid email address.', add: 'Add guests', guest: 'Guest 1 email', submit: 'Schedule Meeting', sent: 'Your request has been sent!' },
  ar: { email: null, add: null, guest: 'بريد الضيف 1', submit: null, sent: null },
} as const;

interface Seen { posts: unknown[] }

async function open(page: Page, lang: Lang, reply?: { status: number; json: unknown }): Promise<Seen> {
  await mockApi(page, lang, [(path) => (path === 'contact/info' ? { email: 'sales@nas.test', phone: '+20 100 000 0000' } : undefined)], false);
  const seen: Seen = { posts: [] };
  await page.route(`${API}contact`, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    seen.posts.push(route.request().postDataJSON());
    return route.fulfill(reply ?? { status: 201, json: { status: 'success', message: '', result: { id: 1 } } });
  });
  await page.goto('/request-demo');
  await expect(page.locator('#c-name')).toBeVisible();
  return seen;
}

async function fillRequired(page: Page, email: string): Promise<void> {
  await page.locator('#c-name').fill('Hesham Adly');
  await page.locator('#c-email').fill(email);
  await page.locator('#c-job').fill('L&D Manager');
  await page.locator('#c-company').fill('Acme');
}

for (const lang of ['en', 'ar'] as Lang[]) {
  test(`addresses that cannot be mailed are field errors; guests are sent (${lang})`, async ({ page }, info) => {
    const seen = await open(page, lang);
    await fillRequired(page, 'hesham@company');

    await page.locator('.booking-form__add-guests').click();
    const guest = page.locator('#c-guest-0');
    await expect(guest).toHaveAttribute('aria-label', TEXT[lang].guest);
    await guest.fill('mona@');
    await page.locator('.booking-form__submit').click();

    const emailError = page.locator('#c-email-error');
    await expect(emailError).toBeVisible();
    await expect(emailError).toHaveAttribute('role', 'alert');
    if (TEXT[lang].email) await expect(emailError).toHaveText(TEXT[lang].email!);
    await expect(page.locator('#c-email')).toHaveAttribute('aria-describedby', 'c-email-error');
    await expect(page.locator('#c-guest-0-error')).toBeVisible();
    await expect(guest).toHaveAttribute('aria-invalid', 'true');
    expect(seen.posts).toHaveLength(0);

    // Every error sits inside the card, at every width.
    const card = (await page.locator('.booking-card').boundingBox())!;
    for (const id of ['#c-email-error', '#c-guest-0-error']) {
      const b = (await page.locator(id).boundingBox())!;
      expect(b.x >= card.x - 1 && b.x + b.width <= card.x + card.width + 1).toBe(true);
    }
    expect(await pageOverflowX(page)).toBeLessThanOrEqual(1);
    mkdirSync(ARTIFACTS, { recursive: true });
    await page.screenshot({ path: resolve(ARTIFACTS, `${info.project.name}-${lang}-errors.png`), fullPage: true });

    await page.locator('#c-email').fill('hesham@company.test');
    await guest.fill('  mona@company.test ');
    await page.locator('.booking-form__add-guests').click();
    await page.locator('#c-guest-1').fill('omar@company.test');
    await page.locator('.booking-form__submit').click();

    await expect(page.locator('.success')).toBeVisible();
    expect(seen.posts).toHaveLength(1);
    expect(seen.posts[0]).toMatchObject({ email: 'hesham@company.test', guests: ['mona@company.test', 'omar@company.test'] });
    if (TEXT[lang].sent) await expect(page.locator('.success__title')).toHaveText(TEXT[lang].sent!);
  });
}

test.describe('behaviour', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1440, 'behaviour test: desktop project only');

  test('a server 422 shows on the field it names, with no toast', async ({ page }) => {
    await open(page, 'en', { status: 422, json: { status: 'fail', message: 'The given data was invalid.', errors: {
      email: ['The email field must be a valid email address.'],
      'guests.0': ['The guest email field must be a valid email address.'],
    } } });
    await fillRequired(page, 'hesham@company.test');
    await page.locator('.booking-form__add-guests').click();
    await page.locator('#c-guest-0').fill('mona@company.test');
    await page.locator('.booking-form__submit').click();

    await expect(page.locator('#c-email-error')).toHaveText('The email field must be a valid email address.');
    await expect(page.locator('#c-guest-0-error')).toHaveText('The guest email field must be a valid email address.');
    await expect(page.locator('.tst')).toHaveCount(0);
    await expect(page.locator('.booking-form__submit')).toBeEnabled();
  });

  test('a server failure shows one toast and keeps the form', async ({ page }) => {
    await open(page, 'en', { status: 500, json: { status: 'error', message: 'Server error' } });
    await fillRequired(page, 'hesham@company.test');
    await page.locator('.booking-form__submit').click();
    await expect(page.locator('.tst')).toHaveCount(1);
    await expect(page.locator('#c-name')).toHaveValue('Hesham Adly');
  });

  test('no more than 5 guests can be added', async ({ page }) => {
    await open(page, 'en');
    const add = page.locator('.booking-form__add-guests');
    for (let i = 0; i < 5; i++) await add.click();
    await expect(page.locator('.guests__row')).toHaveCount(5);
    // At the limit the Add guests button is removed (human, 2026-10-07).
    await expect(add).toHaveCount(0);
    // Removing a guest brings it back.
    await page.locator('.guests__remove').first().click();
    await expect(add).toBeVisible();
  });
});
