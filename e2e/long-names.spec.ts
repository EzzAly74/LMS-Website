import { expect, Page, test } from '@playwright/test';

import { Lang, mockApi, pageOverflowX } from './fixtures/api-mock';
import { course } from './fixtures/course-detail';

/**
 * NEW2B-5769: a long course name must wrap inside its box, never overlap the
 * text beside it or push the page sideways. Two names: a long sentence and a
 * single unbroken word (a pasted code or URL). Catalogue card, course details
 * header / enrolment card and My Learnings, at every width in EN and AR.
 */
const LONG = {
  sentence: 'Advanced Leadership, Strategic Communication and Change Management for Senior Operations Managers in Multi-Site Teams',
  word: 'LeadershipFundamentalsForNASTeamsOperationsManagementProgramme2026',
} as const;

const card = (id: number, title: string) => ({
  id, title, description: 'Description', course_type: 'online', level: 'intermediate', duration_weeks: 4, image: null, hours: 12,
  has_certificate: true, category: { id: 1, name: 'Leadership' }, instructors: [{ id: 1, name: 'Sara Al-Mansouri', image: null }],
  qualifications: [{ id: 1, name: 'Team Leadership and Organisational Change Management' }], rating: { avg: 4.2, count: 12, sentiment: 'positive' },
  next_cohort: { id: 9, name: 'Cohort A', start_date: '2026-11-01', end_date: '2026-11-29', capacity: 30, enrolled_count: 10, seats_left: 20,
    enrolment_closes_at: null, days_until_deadline: 20, days_until_start: 28, deadline_severity: 'none' },
  cta: { state: 'enrol_now', label_key: 'enums.course_cta_state.enrol_now', enabled: true },
});

const learning = (id: number, title: string) => ({
  id, title, course_type: 'online', image: null, hours: 12, category: null, instructors: [{ id: 3, name: 'Sara Al-Mansouri', image: null }],
  cohort: { id: 7, name: 'Cohort A', start_date: '2026-06-01', end_date: '2026-12-01', session_count: 12 },
  progress: { percent: 60, completed_lectures: 3, total_lectures: 5, attended_sessions: 4, past_sessions: 6, total_sessions: 12, absences: 2, next_unit_title: null },
  certificate_status: 'on_track', certificate_projection: null, evaluation: { available: false },
  rate: null, rate_label: null, session_number: null, session_name: null, isLive: false, live_session: null, learner_machine_code: 'E1',
});

/** Every element matching `selector` sits inside its nearest `container` and the page has no sideways scroll. */
async function expectContained(page: Page, selector: string, container: string): Promise<void> {
  const problems = await page.evaluate(([sel, box]) => {
    const out: string[] = [];
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      const parent = el.closest<HTMLElement>(box);
      if (!parent) return;
      const a = el.getBoundingClientRect();
      const b = parent.getBoundingClientRect();
      if (a.left < b.left - 1 || a.right > b.right + 1) out.push(`${sel} ${Math.round(a.left)}-${Math.round(a.right)} outside ${Math.round(b.left)}-${Math.round(b.right)}`);
      if (el.scrollWidth > el.clientWidth + 1) out.push(`${sel} overflows its own box (${el.scrollWidth} > ${el.clientWidth})`);
    });
    return out;
  }, [selector, container] as const);
  expect(problems).toEqual([]);
  expect(await pageOverflowX(page)).toBeLessThanOrEqual(0);
}

for (const lang of ['en', 'ar'] as Lang[]) {
  for (const [kind, title] of Object.entries(LONG)) {
    test(`catalogue card (${kind}, ${lang})`, async ({ page }, info) => {
      await mockApi(page, lang, [(p) => (p === 'learner/academy/courses' ? [card(6, title), card(7, 'Short name')] : undefined)]);
      await page.goto('/catalogue');
      await expect(page.locator('.course-card').first()).toBeVisible();
      await expectContained(page, '.course-card__title, .course-card__title a', '.course-card');
      await page.screenshot({ path: `e2e-artifacts/long-names/catalogue-${kind}-${lang}-${info.project.name}.png`, fullPage: true });
    });

    test(`course details (${kind}, ${lang})`, async ({ page }, info) => {
      await mockApi(page, lang, [(p) => (p === 'learner/academy/courses/6'
        ? { ...course(), title, qualifications: [{ id: 1, name: 'Team Leadership and Organisational Change Management' }] }
        : undefined)]);
      await page.goto('/catalogue/6');
      await expect(page.locator('.detail-hero__title')).toBeVisible();
      await expectContained(page, '.detail-hero__title', '.detail-head');
      await expectContained(page, '.breadcrumb', '.detail-head');
      await expectContained(page, '.detail-hero__qtag', '.detail-meta');
      await page.screenshot({ path: `e2e-artifacts/long-names/detail-${kind}-${lang}-${info.project.name}.png`, fullPage: true });
    });

    test(`my learnings (${kind}, ${lang})`, async ({ page }, info) => {
      await mockApi(page, lang, [(p) => (p === 'learner/profile/learnings' ? [learning(6, title), learning(7, 'Short name')] : undefined)]);
      await page.goto('/my-learnings');
      await page.waitForLoadState('networkidle');
      expect(await pageOverflowX(page)).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `e2e-artifacts/long-names/my-learnings-${kind}-${lang}-${info.project.name}.png`, fullPage: true });
    });
  }
}
