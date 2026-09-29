/** Course player payloads for the Website specs (my/courses/{c}/outline, assignment take / answer / results). */

export const COURSE_ID = 6;
export const ASSIGNMENT_ID = 41;
export const QUESTION_ID = 901;

export function outline() {
  return {
    course_id: COURSE_ID,
    course_title: 'Customer Experience Essentials',
    certificate_status: {
      status: 'on_track', blocked_reason: null, message: null, certificate_mode: 'score',
      attendance_percent: null, score_percent: null, attendance_threshold: null, score_threshold: null,
    },
    modules_completed: 4,
    modules_total: 9,
    weeks: [
      {
        label: 'Week 2: Understanding Customers',
        items: [
          { kind: 'lecture', id: 11, title: 'Customer Journey Mapping', content_type: 'video', completed: true, active: false },
          { kind: 'assignment', id: ASSIGNMENT_ID, title: 'Assignment', content_type: null, completed: false, active: true },
        ],
      },
    ],
  };
}

const base = `http://127.0.0.1:8000/api/v1/courses/${COURSE_ID}/assignments/${ASSIGNMENT_ID}/questions/${QUESTION_ID}`;

export const template = { name: 'Source file.xlsx', size: 48_000, download_url: `${base}/attachment` };

export function myFile(name = 'My work.pdf') {
  return { name, size: 2_400_000, uploaded_at: '2026-09-29 10:15:00', download_url: `${base}/my-file` };
}

export function take(submitted = false, withFile = false) {
  return {
    assignment: {
      id: ASSIGNMENT_ID, title: 'Complete the source file',
      instructions: 'Download the instructor-provided template, complete the required sections, and upload your finished work.',
      pass_score: 10, total_score: 20, due_date: null, questions_count: 1, answered_count: withFile ? 1 : 0,
    },
    submission_id: 77,
    submission_status: submitted ? 'submitted' : 'pending',
    resume_question_id: withFile ? null : QUESTION_ID,
    questions: [{
      id: QUESTION_ID, position: 1, type: 'file', score: 20, question: 'Complete the source file', options: null,
      my_answer: null, is_answered: withFile, attachment: template, my_file: withFile ? myFile() : null, can_replace: true,
    }],
  };
}

export function results(state: 'pending' | 'correct' = 'pending', fileName = 'My work.pdf') {
  return {
    submission_id: 77, submission_status: 'submitted',
    total_score: state === 'pending' ? 0 : 18, max_score: 20, percent: state === 'pending' ? 0 : 90,
    pass_score: 10, passed: state === 'pending' ? null : true, submitted_at: '2026-09-29 10:15:00',
    answers: [{
      question_id: QUESTION_ID, position: 1, type: 'file', question: 'Complete the source file', score: 20,
      awarded_score: state === 'pending' ? null : 18, state, my_answer: null, my_file: myFile(fileName), correct_answer: null,
    }],
  };
}
