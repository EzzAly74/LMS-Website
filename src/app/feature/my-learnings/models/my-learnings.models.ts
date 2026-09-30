import { DeliveryType } from '../../catalogue/models/catalogue.models';

export type CertificateStatusValue = 'earned' | 'on_track' | 'at_risk' | 'blocked';

/**
 * Certificate progress projection for a course the learner is actively
 * taking — server-computed from the course's configured mode
 * (attendance/score/both) via CertificateProjectionService, so the frontend
 * never re-derives this business rule. `status` is null when the course
 * doesn't offer a certificate at all.
 */
export interface CertificateStatus {
  status: CertificateStatusValue | null;
  blocked_reason: string | null;
  message: string | null;
  certificate_mode: 'attendance' | 'score' | 'both' | null;
  attendance_percent: number | null;
  score_percent: number | null;
  attendance_threshold: number | null;
  score_threshold: number | null;
}

export interface ActiveCourseCohort {
  session_count: number | null;
  start_date: string | null;
  end_date: string | null;
}

/** One card from GET my/learnings — a CourseResource plus dashboard-only fields. */
export interface ActiveCourse {
  id: number;
  title: string;
  image: string | null;
  delivery_type: DeliveryType;
  cohort: ActiveCourseCohort;
  module_progress_percent: number;
  certificate_status: CertificateStatus;
  completed: boolean;
  certificate_id: number | null;
}

/** One item inside a course-outline module group (GET my/courses/{id}/outline). */
export interface OutlineItem {
  kind: 'lecture' | 'quiz' | 'assignment';
  id: number;
  title: string;
  content_type: string | null;
  completed: boolean;
  active?: boolean;
}

/** A titled group of outline items ("Week 1", "Assessments", …). */
export interface OutlineGroup {
  label: string;
  items: OutlineItem[];
}

/** Course player / detail outline — module groups + progress + cert status. */
export interface CourseOutline {
  course_id: number;
  course_title: string;
  certificate_status: CertificateStatus;
  modules_completed: number;
  modules_total: number;
  /** Ordered, titled groups (backend returns an array of {label, items}). */
  weeks: OutlineGroup[];
}

/* ── Course evaluation (Figma 2194:78325, GET/POST courses/{course}/evaluate) ── */

/** five = 32 px stars; scale = 1-5 radios with end labels; ten = 1-10 radios; text = free text. */
export type EvaluationQuestionType = 'five' | 'scale' | 'ten' | 'text';

export interface EvaluationQuestion {
  id: number;
  type: EvaluationQuestionType;
  title: string;
  is_required: boolean;
  /** Top of the scale (5 or 10); null for free text. */
  scale_max: number | null;
  scale_label_min: string | null;
  scale_label_max: string | null;
}

export interface EvaluationTemplate {
  id: number;
  name: string;
  questions: EvaluationQuestion[];
}

export interface EvaluationForm {
  already_evaluated: boolean;
  /** POST needs one of these as `instructor_id`. */
  instructors: { id: number; name: string }[];
  evaluation_categories: EvaluationTemplate[];
}

/** question id → a 1..scale_max number, or the text answer. */
export type EvaluationAnswers = Record<number, number | string>;

/**
 * POST courses/{id}/evaluate result: the learner's new "My Rating" (the
 * rounded average of their star and 1-5 answers), null when the form had none.
 */
export interface EvaluationSubmitResult {
  rating: number | null;
  rate_label: string | null;
}
