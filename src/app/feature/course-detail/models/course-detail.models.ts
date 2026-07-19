import { CatalogueCategory, CourseCtaState, CourseLevel, DeliveryType } from '../../catalogue/models/catalogue.models';

export interface CourseDetailInstructor {
  id: number;
  name: string;
  image: string | null;
  bio: string | null;
}

export interface CourseDetailQualification {
  id: number;
  name: string;
  description?: string;
}

export interface CourseDetailRating {
  avg: number;
  count: number;
  sentiment: string;
}

/** One lecture/content unit, per GET .../courses/{id} `units`. */
export interface CourseUnit {
  id: number;
  title: string;
  content_type: string;
  label_key: string;
  duration_minutes: number | null;
  learner_scope: string;
  session_id: number | null;
  require_completion: boolean;
}

export interface CohortSession {
  id: number;
  title: string;
  session_date: string;
  time_from: string | null;
  time_to: string | null;
  location: string | null;
}

export interface CohortBlock {
  id: number;
  name: string;
  effective_status: string;
  start_date: string;
  end_date: string;
  capacity: number | null;
  enrolled_count: number;
  seats_left: number | null;
  is_full: boolean;
  enrolment_closes_at: string | null;
  days_until_deadline: number | null;
  deadline_severity: string;
  sessions: CohortSession[];
}

export interface CourseDetailCta {
  state: CourseCtaState;
  label_key: string;
  enabled: boolean;
}

/** Bilingual bullet list — both locales returned; pick the active one client-side. */
export interface LocalizedList {
  en: string[];
  ar: string[];
}

/** Full response of GET /learner/academy/courses/{id}. */
export interface CourseDetail {
  id: number;
  title: string;
  description: string;
  course_type: DeliveryType;
  level: CourseLevel | null;
  duration_weeks: number | null;
  image: string | null;
  hours: number;
  has_certificate: boolean;
  allow_attendance: boolean;
  category: CatalogueCategory | null;
  instructors: CourseDetailInstructor[];
  qualifications: CourseDetailQualification[];
  rating: CourseDetailRating;
  enrolled_users_count: number;
  units: CourseUnit[];
  cohorts: CohortBlock[];
  anchor_cohort: CohortBlock | null;
  cta: CourseDetailCta;
  what_students_will_learn: LocalizedList;
  requirements: LocalizedList;
}

export type CourseDetailTab = 'overview' | 'curriculum' | 'instructor';
