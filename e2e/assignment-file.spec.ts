import { expect, test } from '@playwright/test';

import { Lang, mockApi, pageOverflowX } from './fixtures/api-mock';
import { ASSIGNMENT_ID, COURSE_ID, QUESTION_ID, outline, results, take } from './fixtures/course-player';

/**
 * Course player › file assignment (Figma 2027:97785: 2003:79350 empty,
 * 1993:78733 chosen, 2003:79618 / 2005:80893 pending results), mocked API.
 */

const learn = `/my-learnings/${COURSE_ID}/learn`;
const answerPath = `courses/${COURSE_ID}/assignments/${ASSIGNMENT_ID}/questions/${QUESTION_ID}/answer`;
const T = {
  en: { submit: 'Submit Assignment', select: 'Select file', replace: 'Replace file', download: 'Download', pending: 'Pending', type: 'not accepted' },
  ar: { submit: 'تسليم المهمة', select: 'اختر ملفًا', replace: 'استبدال الملف', download: 'تنزيل', pending: 'قيد', type: 'غير مقبول' },
};

const pdf = { name: 'My work.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 e2e') };

for (const lang of ['en', 'ar'] as Lang[]) {
  test.describe(`File assignment (${lang})`, () => {
    test('template download, choose / remove / submit, then pending results', async ({ page }, info) => {
      let uploaded = '';
      await mockApi(page, lang, [
        (p) => (p === `my/courses/${COURSE_ID}/outline` ? outline() : undefined),
        (p) => (p === `courses/${COURSE_ID}/assignments/${ASSIGNMENT_ID}/take` ? take() : undefined),
        (p, route) => {
          if (p !== answerPath) return undefined;
          uploaded = route.request().postDataBuffer()?.toString('latin1') ?? '';
          return {
            question_id: QUESTION_ID, is_correct: null, pending: true, awarded_score: null, max_score: 20, correct_answer: null,
            my_file: results().answers[0].my_file, running_total_score: 0, assignment_max_score: 20,
            answered_count: 1, questions_count: 1, finalized: true, results: results(),
          };
        },
      ]);
      await page.route(`**/questions/${QUESTION_ID}/attachment`, (r) =>
        r.fulfill({ body: 'xlsx-bytes', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));

      await page.goto(learn);
      const t = T[lang];
      const submit = page.getByRole('button', { name: t.submit });
      await expect(submit).toBeVisible();
      await expect(submit).toBeDisabled();
      await expect(page.locator('.quiz-runner__instructions')).toContainText('instructor-provided template');
      await expect(page.locator('.quiz-runner__score')).toHaveCount(0);

      // Template download goes through the authorized API route.
      const download = page.waitForEvent('download');
      await page.locator('.fa__download').click();
      expect((await download).suggestedFilename()).toBe('Source file.xlsx');

      await page.screenshot({ path: `e2e-artifacts/assignment-empty-${lang}-${info.project.name}.png`, fullPage: true });

      // A wrong type is refused before upload.
      const chooser = page.locator('.fa__input');
      await chooser.setInputFiles({ name: 'run.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') });
      await expect(page.locator('.fa__error')).toContainText(t.type);
      await expect(submit).toBeDisabled();

      await chooser.setInputFiles(pdf);
      await expect(page.locator('.fa__error')).toBeEmpty();
      await expect(page.locator('.fa__upload app-file-card')).toContainText('My work.pdf');
      await expect(submit).toBeEnabled();
      await page.screenshot({ path: `e2e-artifacts/assignment-chosen-${lang}-${info.project.name}.png`, fullPage: true });

      await page.locator('.fa__remove').click();
      await expect(page.locator('.fa__upload app-file-card')).toHaveCount(0);
      await expect(submit).toBeDisabled();

      await chooser.setInputFiles(pdf);
      await submit.click();

      // Multipart with the file under "file".
      await expect(page.locator('.score-summary')).toBeVisible();
      expect(uploaded).toContain('name="file"; filename="My work.pdf"');
      await expect(page.locator('.score-summary__ring')).toContainText('---');
      await expect(page.locator('.question-card')).toContainText('My work.pdf');
      await expect(page.locator('.question-card__points')).toContainText(t.pending);
      await expect(page.getByRole('button', { name: t.replace })).toBeVisible();

      expect(await pageOverflowX(page)).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `e2e-artifacts/assignment-results-${lang}-${info.project.name}.png`, fullPage: true });
    });

    test('a submitted assignment opens on its results; a scored file cannot be replaced', async ({ page }) => {
      await mockApi(page, lang, [
        (p) => (p === `my/courses/${COURSE_ID}/outline` ? outline() : undefined),
        (p) => (p === `courses/${COURSE_ID}/assignments/${ASSIGNMENT_ID}/take` ? take(true, true) : undefined),
        (p) => (p === `courses/${COURSE_ID}/assignments/${ASSIGNMENT_ID}/results` ? results('correct') : undefined),
      ]);
      await page.goto(learn);
      await expect(page.locator('.score-summary__ring')).toContainText('18');
      await expect(page.locator('.question-card')).toContainText('My work.pdf');
      await expect(page.getByRole('button', { name: T[lang].replace })).toHaveCount(0);
      await expect(page.getByRole('button', { name: T[lang].submit })).toHaveCount(0);
    });

    test('replacing a pending file re-uploads and refreshes the results', async ({ page }) => {
      let uploads = 0;
      await mockApi(page, lang, [
        (p) => (p === `my/courses/${COURSE_ID}/outline` ? outline() : undefined),
        (p) => (p === `courses/${COURSE_ID}/assignments/${ASSIGNMENT_ID}/take` ? take(true, true) : undefined),
        (p) => (p === `courses/${COURSE_ID}/assignments/${ASSIGNMENT_ID}/results` ? results('pending', uploads ? 'Second try.docx' : 'My work.pdf') : undefined),
        (p) => {
          if (p !== answerPath) return undefined;
          uploads++;
          return { question_id: QUESTION_ID, pending: true, my_file: null, running_total_score: 0, assignment_max_score: 20, answered_count: 1, questions_count: 1, finalized: true, results: null };
        },
      ]);
      await page.goto(learn);
      await expect(page.locator('.question-card')).toContainText('My work.pdf');
      await page.locator('.question-card__file-input').setInputFiles({
        name: 'Second try.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('PK'),
      });
      await expect(page.locator('.question-card')).toContainText('Second try.docx');
      expect(uploads).toBe(1);
    });
  });
}
