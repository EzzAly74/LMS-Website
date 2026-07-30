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
