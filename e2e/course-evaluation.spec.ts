import { expect, Page, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { API, Lang, mockApi, pageOverflowX } from './fixtures/api-mock';

/**
 * Website course evaluation: the "Evaluate course · Add My Feedback" row on the
 * My Learnings course detail (Figma 2078:104643; phone 2194:79138) and the
 * Learner Evaluation modal (2194:78325 / 2274:132908; phone 2180:112624),
 * against a mocked API in the real response shapes.
 */

const ARTIFACTS = resolve(__dirname, '../e2e-artifacts/course-evaluation');
const COURSE_ID = 41;

const learning = (evaluable = true) => ({
  id: COURSE_ID, title: 'Customer Experience Essentials', course_type: 'online', image: null, hours: 12,
  category: null, instructors: [{ id: 3, name: 'Sara Al-Mansouri', image: null }],
  cohort: { id: 7, name: 'Cohort A', start_date: '2026-06-01', end_date: '2026-12-01' },
  progress: { percent: 60, completed_lectures: 3, total_lectures: 5, attended_sessions: 4, past_sessions: 6, total_sessions: 12, absences: 2, next_unit_title: null },
  certificate_status: 'on_track', certificate_projection: null, evaluation: { available: evaluable },
  rate: null, rate_label: null, session_number: null, session_name: null, isLive: false, live_session: null, learner_machine_code: 'E1',
});

const outline = {
  course_id: COURSE_ID, course_title: 'Customer Experience Essentials', certificate_status: { status: 'on_track', message: null },
  modules_completed: 3, modules_total: 5,
  weeks: [{ label: 'Introduction to CX', items: [
    { id: 1, kind: 'lecture', title: 'What is Customer Experience?', content_type: 'video', completed: true },
    { id: 2, kind: 'assignment', title: 'NAS CX Framework Overview', content_type: null, completed: false },
  ] }],
};

const q = (id: number, type: string, title: string, required: boolean, max: number | null) => ({
  id, type, title, is_required: required, scale_max: max,
  scale_label_min: type === 'scale' ? 'Needs significant improvement' : null, scale_label_max: type === 'scale' ? 'Excellent' : null,
});

const form = (already = false, instructors = [{ id: 3, name: 'Sara Al-Mansouri' }]) => ({
  already_evaluated: already, instructors,
  evaluation_categories: [{ id: 5, name: 'Course Feedback', questions: [
    q(11, 'scale', 'How would you rate the overall course quality?', true, 5),
    q(12, 'five', 'Rate your learning experience', false, 5),
    q(13, 'scale', 'Would you recommend this course to another learner?', true, 5),
    q(14, 'five', 'Would you like to work with this instructor again?', true, 5),
    q(15, 'text', 'Anything else we should know?', false, null),
  ] }],
});

/** A long form as real courses have it: two templates, 1-5, stars, 1-10 and free text. */
const longForm = () => ({
  already_evaluated: false, instructors: [{ id: 3, name: 'Sara Al-Mansouri' }],
  evaluation_categories: [
    form().evaluation_categories[0],
    { id: 6, name: 'Instructor Evaluation', questions: [
      q(21, 'five', 'How would you rate the instructor\'s knowledge of the subject?', true, 5),
      q(22, 'five', 'How well did the instructor explain concepts and answer questions?', true, 5),
      q(23, 'ten', 'How likely are you to recommend this instructor to a colleague?', true, 10),
      q(24, 'text', 'What could the instructor do better?', false, null),
    ] },
  ],
});

interface Opts { evaluable?: boolean; already?: boolean; instructors?: { id: number; name: string }[]; long?: boolean }

async function openDetail(page: Page, lang: Lang, opts: Opts = {}): Promise<{ evaluateGets: () => number }> {
  let gets = 0;
  await mockApi(page, lang, [
    (path) => (path === 'learner/profile/summary'
      ? { learner: { id: 9001, machine_code: null, name: 'Huda Atef', email: null, image: null, department_name: 'Human Resources', job_title: null, learner_type: null },
          counts: { required: 7, earned: 2, in_progress: 3, not_started: 2 } }
      : undefined),
    (path) => (path === 'learner/profile/learnings' ? [learning(opts.evaluable ?? true)] : undefined),
    (path) => (path === 'learner/profile/schedule' ? { range: { start: '2026-09-27', end: '2026-10-03' }, sessions: [] } : undefined),
    (path) => (path === `my/courses/${COURSE_ID}/outline` ? outline : undefined),
    (path, route) => {
      if (path !== `courses/${COURSE_ID}/evaluate` || route.request().method() !== 'GET') return undefined;
      gets++;
      return opts.long ? longForm() : form(opts.already ?? false, opts.instructors);
    },
  ]);
  await page.goto('/profile');
  await page.getByRole('tab', { name: lang === 'ar' ? /تعلّم|تعلم/ : /My Learnings/ }).click();
  await page.locator('.ml-row').first().click();
  await expect(page.locator('app-course-detail')).toBeVisible();
  return { evaluateGets: () => gets };
}

test.describe('behaviour', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1440, 'behaviour test: desktop project only');

  test('answer the required questions, submit once, and the row goes', async ({ page }) => {
    await openDetail(page, 'en');
    const posts: unknown[] = [];
    await page.route(`${API}courses/${COURSE_ID}/evaluate`, (r) => {
      if (r.request().method() !== 'POST') return r.fallback();
      posts.push(r.request().postDataJSON());
      return r.fulfill({ status: 201, json: { status: 'success', message: 'Created' } });
    });

    const row = page.locator('.cd-evaluate');
    await expect(row).toContainText('Evaluate course');
    const open = row.getByRole('button', { name: 'Add My Feedback' });
    await open.click();

    const d = page.getByRole('dialog', { name: 'Learner Evaluation' });
    await expect(d).toBeVisible();
    const submit = d.getByRole('button', { name: 'Submit Evaluation' });
    const bar = d.getByRole('progressbar');
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await expect(d.locator('.ev__progress-count')).toHaveText('0 out of 5 questions');
    await expect(submit).toBeDisabled();

    // Scale: radio "4" of question 1.
    const q1 = d.getByRole('group', { name: /How would you rate the overall course quality/ });
    await q1.getByRole('radio', { name: '4' }).check();
    await expect(q1.locator('.ev__point.is-on .ev__point-n')).toHaveText('4');
    await d.getByRole('group', { name: /recommend this course/ }).getByRole('radio', { name: /5, Excellent/ }).check();
    await expect(submit).toBeDisabled(); // question 4 is still required

    // Stars: four of five.
    const q4 = d.getByRole('group', { name: /work with this instructor again/ });
    await q4.getByRole('radio', { name: '4 out of 5 stars' }).check();
    await expect(q4.locator('img[src*="star-fill"]')).toHaveCount(4);
    await expect(d.locator('.ev__progress-count')).toHaveText('3 out of 5 questions');
    await expect(submit).toBeEnabled(); // optional 2 and 5 may stay empty

    await d.getByLabel(/Anything else we should know/).fill('  Great pacing.  ');
    await submit.click();

    await expect(d).toBeHidden();
    expect(posts).toEqual([{ instructor_id: 3, questions: { 11: 4, 13: 5, 14: 4, 15: 'Great pacing.' } }]);
    await expect(page.getByText('Thank you. Your evaluation was submitted.')).toBeVisible();
    await expect(page.locator('.cd-evaluate')).toHaveCount(0);
  });

  test('Escape and Cancel close without sending, and focus returns to the button', async ({ page }) => {
    await openDetail(page, 'en');
    let posted = false;
    await page.route(`${API}courses/${COURSE_ID}/evaluate`, (r) => (r.request().method() === 'POST' ? ((posted = true), r.abort()) : r.fallback()));

    const open = page.getByRole('button', { name: 'Add My Feedback' });
    await open.click();
    const d = page.getByRole('dialog', { name: 'Learner Evaluation' });
    await expect(d).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(d).toBeHidden();
    await expect(open).toBeFocused();

    await open.click();
    await d.getByRole('button', { name: 'Cancel' }).click();
    await expect(d).toBeHidden();
    expect(posted).toBe(false);
  });

  test('several instructors: the learner names one before submitting', async ({ page }) => {
    await openDetail(page, 'en', { instructors: [{ id: 3, name: 'Sara Al-Mansouri' }, { id: 4, name: 'Omar Haddad' }] });
    const posts: { instructor_id: number }[] = [];
    await page.route(`${API}courses/${COURSE_ID}/evaluate`, (r) => {
      if (r.request().method() !== 'POST') return r.fallback();
      posts.push(r.request().postDataJSON());
      return r.fulfill({ status: 201, json: { status: 'success', message: 'Created' } });
    });
    await page.getByRole('button', { name: 'Add My Feedback' }).click();
    const d = page.getByRole('dialog', { name: 'Learner Evaluation' });
    await d.getByRole('group', { name: /overall course quality/ }).getByRole('radio', { name: '3' }).check();
    await d.getByRole('group', { name: /recommend this course/ }).getByRole('radio', { name: '3' }).check();
    await d.getByRole('group', { name: /work with this instructor again/ }).getByRole('radio', { name: '5 out of 5 stars' }).check();
    await expect(d.getByRole('button', { name: 'Submit Evaluation' })).toBeDisabled();
    await d.getByLabel('Instructor you are evaluating').selectOption({ label: 'Omar Haddad' });
    await d.getByRole('button', { name: 'Submit Evaluation' }).click();
    await expect(d).toBeHidden();
    expect(posts[0].instructor_id).toBe(4);
  });

  test('answered elsewhere meanwhile (409): the modal closes and the row goes', async ({ page }) => {
    await openDetail(page, 'en');
    await page.route(`${API}courses/${COURSE_ID}/evaluate`, (r) => (r.request().method() === 'POST'
      ? r.fulfill({ status: 409, json: { status: 'error', message: 'You have already evaluated this course.' } })
      : r.fallback()));
    await page.getByRole('button', { name: 'Add My Feedback' }).click();
    const d = page.getByRole('dialog', { name: 'Learner Evaluation' });
    await d.getByRole('group', { name: /overall course quality/ }).getByRole('radio', { name: '2' }).check();
    await d.getByRole('group', { name: /recommend this course/ }).getByRole('radio', { name: '2' }).check();
    await d.getByRole('group', { name: /work with this instructor again/ }).getByRole('radio', { name: '2 out of 5 stars' }).check();
    await d.getByRole('button', { name: 'Submit Evaluation' }).click();
    await expect(d).toBeHidden();
    await expect(page.locator('.cd-evaluate')).toHaveCount(0);
  });

  test('a rejected answer (422) is shown and the modal stays open', async ({ page }) => {
    await openDetail(page, 'en');
    await page.route(`${API}courses/${COURSE_ID}/evaluate`, (r) => (r.request().method() === 'POST'
      ? r.fulfill({ status: 422, json: { status: 'error', message: 'Invalid', errors: { 'questions.11': ['The answer must be between 1 and 5.'] } } })
      : r.fallback()));
    await page.getByRole('button', { name: 'Add My Feedback' }).click();
    const d = page.getByRole('dialog', { name: 'Learner Evaluation' });
    await d.getByRole('group', { name: /overall course quality/ }).getByRole('radio', { name: '1' }).check();
    await d.getByRole('group', { name: /recommend this course/ }).getByRole('radio', { name: '1' }).check();
    await d.getByRole('group', { name: /work with this instructor again/ }).getByRole('radio', { name: '1 out of 5 stars' }).check();
    await d.getByRole('button', { name: 'Submit Evaluation' }).click();
    await expect(d.getByRole('alert')).toHaveText('The answer must be between 1 and 5.');
    await expect(d).toBeVisible();
  });

  test('no row when the course is not evaluated, or already answered', async ({ page }) => {
    const notOffered = await openDetail(page, 'en', { evaluable: false });
    await expect(page.locator('.cd-header__title')).toBeVisible();
    await expect(page.locator('.cd-evaluate')).toHaveCount(0);
    expect(notOffered.evaluateGets()).toBe(0);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await openDetail(page, 'en', { already: true });
    await expect(page.locator('.cd-header__title')).toBeVisible();
    await expect(page.locator('.cd-evaluate')).toHaveCount(0);
  });
});

for (const lang of ['en', 'ar'] as const) {
  test(`row and modal fit and read ${lang}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await openDetail(page, lang, { long: true });
    await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    const row = page.locator('.cd-evaluate');
    await expect(row).toBeVisible();
    expect(await pageOverflowX(page)).toBeLessThanOrEqual(1);

    const width = page.viewportSize()?.width ?? 0;
    if (width < 600) {
      // Phone: the row sits right under the course card, its button full width.
      const [head, r, modules] = await Promise.all([
        page.locator('.cd-header').boundingBox(), row.boundingBox(), page.locator('.cd-modules').boundingBox(),
      ]);
      expect(r!.y).toBeGreaterThan(head!.y + head!.height - 1);
      expect(r!.y).toBeLessThan(modules!.y);
      const btn = await row.getByRole('button').boundingBox();
      expect(btn!.width).toBeGreaterThan(r!.width - 40);
    }

    mkdirSync(ARTIFACTS, { recursive: true });
    await page.screenshot({ path: resolve(ARTIFACTS, `${info.project.name}-${lang}.png`), fullPage: true });

    await row.getByRole('button').click();
    const d = page.locator('dialog.ev');
    await expect(d).toBeVisible();
    await d.locator('.ev__point').nth(3).click(); // question 1: 4
    await d.locator('.ev__star').nth(8).click(); // question 4: four stars
    const box = await d.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    if (width < 600) expect(Math.round(box!.width)).toBe(width); // full screen
    else expect(Math.round(box!.width)).toBeLessThanOrEqual(832);
    const inner = await d.locator('.ev__scroll').evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(inner).toBeLessThanOrEqual(0);
    // Two template cards with their counts; the 1-10 question as ten pills.
    await expect(d.locator('.ev__group')).toHaveCount(2);
    await expect(d.locator('.ev__group-count').first()).toContainText('2/5');
    await expect(d.locator('.ev__pill')).toHaveCount(10);
    await expect(d.locator('.ev__hint')).toContainText(lang === 'ar' ? '4' : 'Required answers left: 4');
    // No native scrollbar, and the title and progress stay put while the questions scroll.
    const bar = await d.locator('.ev__scroll').evaluate((el) => (el as HTMLElement).offsetWidth - el.clientWidth);
    expect(bar).toBe(0);
    const headBefore = await d.locator('.ev__head').boundingBox();
    await d.locator('.ev__scroll').evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await expect(d.locator('.ev__pill').first()).toBeInViewport();
    expect((await d.locator('.ev__head').boundingBox())!.y).toBe(headBefore!.y);
    await d.locator('.ev__pill').nth(7).click();
    await expect(d.locator('.ev__pill.is-on')).toHaveText('8');
    await page.screenshot({ path: resolve(ARTIFACTS, `${info.project.name}-${lang}-modal-end.png`) });
    await d.locator('.ev__scroll').evaluate((el) => el.scrollTo({ top: 0 }));
    await page.screenshot({ path: resolve(ARTIFACTS, `${info.project.name}-${lang}-modal.png`) });

    const text = await page.locator('body').innerText();
    expect(text.match(/\bfeature\.[a-z_.]+/g) ?? []).toEqual([]);
    expect(errors).toEqual([]);
  });
}
