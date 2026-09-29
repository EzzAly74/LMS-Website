import { CertificateStatus } from '../../my-learnings/models/my-learnings.models';

export type LectureContentType = 'video' | 'document' | 'article' | 'link';

export interface CourseLecture {
  id: number;
  title: string;
  description: string;
  content_type: LectureContentType;
  content_url: string | null;
  body: string | null;
  duration_minutes: number | null;
  require_completion: boolean;
  completed: boolean;
}

export type PlaylistItemKind = 'lecture' | 'quiz' | 'assignment';

export interface PlaylistItem {
  kind: PlaylistItemKind;
  id: number;
  title: string;
  content_type: LectureContentType | null;
  completed: boolean;
  active: boolean;
}

export interface CourseWeekGroup {
  label: string;
  items: PlaylistItem[];
}

export interface CoursePlayerOutline {
  course_id: number;
  course_title: string;
  certificate_status: CertificateStatus;
  modules_completed: number;
  modules_total: number;
  weeks: CourseWeekGroup[];
}

export type QuestionType = 'mcq' | 'yes_no' | 'open' | 'reorder' | 'file';

/**
 * A stored file as the API describes it (D-064): never a path. Downloads go
 * through ApiService by ids, not `download_url` (it carries the API host).
 */
export interface StoredFile {
  name: string | null;
  size: number;
  uploaded_at?: string | null;
  download_url: string;
}

/** `assessment_type` selects the URL segment — 'quiz' -> 'quizzes', 'assignment' -> 'assignments'. */
export type AssessmentType = 'quiz' | 'assignment';

/**
 * A rich question as returned by GET courses/{course}/{quizzes|assignments}/{id}/take.
 * `options` is a plain string array for mcq/reorder (yes_no has none — the two
 * choices are fixed True/False); `my_answer` mirrors whatever shape was
 * submitted for this question (`{value}` or `{order}`), or null if unanswered.
 */
export interface AssessmentQuestion {
  id: number;
  position: number;
  type: QuestionType;
  score: number;
  question: string;
  options: string[] | null;
  my_answer: { value?: string; order?: string[] } | null;
  is_answered: boolean;
  /** File questions (assignments only): the instructor's template. */
  attachment?: StoredFile | null;
  /** File questions: the learner's uploaded answer. */
  my_file?: StoredFile | null;
  /** File questions: false once a person has scored the file (D-064). */
  can_replace?: boolean;
}

export interface AssessmentMeta {
  id: number;
  title: string;
  instructions: string | null;
  pass_score: number | null;
  total_score: number;
  due_date: string | null;
  questions_count: number;
  answered_count: number;
}

/**
 * GET .../take response. The quiz endpoint names the meta `quiz`, the
 * assignment endpoint `assignment`; the service fills `quiz` for both (B-140).
 */
export interface AssessmentTakeState {
  quiz: AssessmentMeta;
  submission_id: number;
  submission_status: string;
  resume_question_id: number | null;
  questions: AssessmentQuestion[];
}

/** Answer payload for POST .../questions/{question}/answer. */
export type SubmittedAnswer = { value: string } | { order: string[] };

/** Response of POST .../questions/{question}/answer. */
export interface AnswerFeedback {
  question_id: number;
  is_correct: boolean | null;
  pending: boolean;
  awarded_score: number;
  max_score: number;
  correct_answer: string | string[] | null;
  /** File questions: the file just stored. */
  my_file?: StoredFile | null;
  running_total_score: number;
  /** `assignment_max_score` from the assignment endpoint, normalised by the service. */
  quiz_max_score: number;
  answered_count: number;
  questions_count: number;
  finalized: boolean;
  results: AssessmentResults | null;
}

export type QuestionReviewState = 'correct' | 'incorrect' | 'pending';

/** One entry in the results `answers` array. */
export interface QuestionReview {
  question_id: number;
  position: number;
  type: QuestionType;
  question: string;
  score: number;
  awarded_score: number | null;
  state: QuestionReviewState;
  my_answer: { value?: string; order?: string[] } | null;
  my_file?: StoredFile | null;
  correct_answer: string | string[] | null;
}

/** GET .../results (and the `finish`/finalizing answer response) shape. */
export interface AssessmentResults {
  submission_id: number;
  submission_status: string;
  total_score: number;
  max_score: number;
  percent: number;
  pass_score: number | null;
  passed: boolean | null;
  submitted_at: string | null;
  answers: QuestionReview[];
}
