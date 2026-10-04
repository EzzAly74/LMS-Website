import { expect, test } from '@playwright/test';

import { API, Lang, mockApi } from './fixtures/api-mock';

/**
 * NEW2B-5797: a wrong attendance passcode empties every box and puts the
 * cursor back in the first one; the reason is announced and goes away once
 * the learner types again. EN + AR. Mocked API.
 */
const learning = {
  id: 8, title: 'Management Course', course_type: 'offline', image: null, hours: 3, category: null,
  instructors: [{ id: 1, name: 'Mohamed Said', image: null }],
  cohort: { id: 29, name: 'Third Group', start_date: '2026-10-11', end_date: '2026-10-11', session_count: 1 },
  progress: { percent: 0, completed_lectures: 0, total_lectures: 6, attended_sessions: 0, past_sessions: 0, total_sessions: 1, absences: 0, next_unit_title: null },
  certificate_status: 'on_track', certificate_projection: null, evaluation: { available: false }, rate: null, rate_label: null,
  session_number: 1, session_name: 'session 1', isLive: true,
  live_session: { id: 31, title: 'session 1', session_date: '2026-10-11', time_from: '14:00:00', time_to: '17:00:00', location: 'HQ', attended: false },
  learner_machine_code: '2394',
};

test.describe('passcode', () => {
  // Behaviour, not layout: on narrow widths the sidebar CTA sits in an animated panel.
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1440, 'behaviour test: desktop project only');

for (const lang of ['en', 'ar'] as Lang[]) {
  test(`wrong passcode clears the boxes (${lang})`, async ({ page }) => {
    await mockApi(page, lang, [
      (p) => (p === 'learner/profile/summary'
        ? { learner: { id: 25, machine_code: '2394', name: 'Ezz Eldin', email: null, image: null, department_name: null, job_title: null, learner_type: null },
            counts: { required: 1, earned: 0, in_progress: 1, not_started: 0 } }
        : undefined),
      (p) => (p === 'learner/profile/learnings' ? [learning] : undefined),
      (p) => (p === 'learner/profile/schedule' ? { range: { start: '2026-10-11', end: '2026-10-17' }, sessions: [] } : undefined),
    ]);
    const posted: string[] = [];
    await page.route(`${API}learner/profile/attendance/mark`, (route) => {
      const code = (route.request().postDataJSON() as { passcode: string }).passcode;
      posted.push(code);
      return route.fulfill({ json: code === '24680'
        ? { status: 'success', message: '', result: null }
        : { status: 'error', message: lang === 'en' ? 'Wrong passcode' : 'رمز الحضور غير صحيح', result: null } });
    });
    await page.goto('/profile');

    const cta = page.locator('.side-card__cta').first();
    await cta.click();

    const boxes = page.locator('.otp__box');
    await expect(boxes).toHaveCount(5);
    await boxes.first().focus();
    await page.keyboard.type('13579');
    await page.locator('.passcode__submit').click();

    await expect(page.locator('.passcode__error')).toHaveAttribute('role', 'alert');
    await expect(page.locator('.passcode__error')).toContainText(lang === 'en' ? 'Wrong passcode' : 'غير صحيح');
    for (let i = 0; i < 5; i++) await expect(boxes.nth(i)).toHaveValue('');
    await expect(boxes.first()).toBeFocused();
    await expect(page.locator('.passcode__submit')).toBeDisabled();

    await page.keyboard.type('2');
    await expect(page.locator('.passcode__error')).toHaveCount(0);
    await page.keyboard.type('4680');
    await page.locator('.passcode__submit').click();
    await expect(page.locator('.passcode')).toHaveCount(0);
    expect(posted).toEqual(['13579', '24680']);
  });
}
});
