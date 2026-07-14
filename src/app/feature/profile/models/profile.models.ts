/** Payloads for the learner Profile dashboard (/api/v1/learner/profile/*). */

/** Learner identity card (shared LearnerIdentityResource shape). */
export interface ProfileLearner {
  id: number;
  machine_code: string | null;
  name: string;
  email: string | null;
  image: string | null;
  department_name: string | null;
  job_title: { id: number; name: string } | null;
  learner_type: string | null;
}

/** The four header counters. `earned + in_progress + not_started === required`. */
export interface ProfileCounts {
  required: number;
  earned: number;
  in_progress: number;
  not_started: number;
}

export interface ProfileSummary {
  learner: ProfileLearner;
  counts: ProfileCounts;
}

/** A course the learner has completed toward a qualification. */
export interface EarnedCourse {
  course_id: number;
  title: string;
  completed_at: string | null;
  certificate_id: number | null;
  also_in: string[];
}

/** A course still required for a qualification but not yet earned. */
export interface UncoveredCourse {
  course_id: number;
  title: string;
  cohort_scheduled: boolean;
  also_in: string[];
}

/** One qualification with its per-course earned/uncovered breakdown. */
export interface QualificationProgress {
  id: number;
  name: string;
  total_courses: number;
  completed_courses: number;
  percent: number;
  earned_courses: EarnedCourse[];
  uncovered_courses: UncoveredCourse[];
}

/** Live session currently open for attendance on an active course. */
export interface LiveSession {
  id: number;
  title: string | null;
  session_date: string | null;
  time_from: string | null;
  time_to: string | null;
  location: string | null;
  attended: boolean;
}

/** Progress + attendance rollup for one active enrolment. */
export interface LearningProgress {
  percent: number;
  completed_lectures: number;
  total_lectures: number;
  attended_sessions: number;
  past_sessions: number;
  total_sessions: number;
  absences: number;
  next_unit_title: string | null;
}

export type DeliveryType = 'online' | 'offline' | 'hybrid' | 'external_link';

/** One active-course row (mobile MyLearningActiveCourseResource). */
export interface LearningCourse {
  id: number;
  title: string;
  course_type: DeliveryType;
  image: string | null;
  hours: number;
  category: { id: number; name: string } | null;
  instructors: { id: number; name: string; image: string | null }[];
  cohort: { id: number; name: string; start_date: string; end_date: string } | null;
  progress: LearningProgress;
  rate: number | null;
  rate_label: string | null;
  session_number: number | null;
  session_name: string | null;
  isLive: boolean;
  live_session: LiveSession | null;
  learner_machine_code: string;
}

/** One cohort session with the learner's attendance flag. */
export interface SessionAttendance {
  id: number;
  title: string;
  session_date: string | null;
  time_from: string | null;
  time_to: string | null;
  attended: boolean;
}

/** One completed course (the "Completed" My-Learnings sub-tab). */
export interface CompletedCourse {
  course_id: number;
  title: string;
  image: string | null;
  course_type: DeliveryType;
  completed_at: string | null;
  score_percent: number | null;
  certificate_id: number | null;
  certificate_earned: boolean;
}

/** An earned certificate (mobile CertificateResource). */
export interface ProfileCertificate {
  id: number;
  uuid: string;
  certificate_number: string;
  status: string;
  course_id: number;
  course_title: string;
  issued_at: string | null;
  issued_date: string | null;
}

/** Which My-Learnings sub-tab is active. */
export type LearningStatus = 'upcoming' | 'current' | 'completed';

/** Which top-level profile tab is active. `schedule` is a mobile-only tab that
 * surfaces the right-rail (Active Session / attendance) content. */
export type ProfileTab = 'qualifications' | 'my_learnings' | 'schedule';
