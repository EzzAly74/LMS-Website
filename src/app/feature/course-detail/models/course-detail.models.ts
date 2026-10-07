import { CatalogueCategory, CourseCtaState, CourseLevel, DeliveryType } from '../../catalogue/models/catalogue.models';

/** One of the instructor's other courses (Instructor tab, Figma 818:40243). */
export interface InstructorOtherCourse {
  id: number;
  title: string;
  image: string | null;
  course_type: DeliveryType;
  level: CourseLevel | null;
  duration_weeks: number | null;
}

export interface CourseDetailInstructor {
  id: number;
  name: string;
  /** Job title, in the request language; null when not set (NEW2B-5926). */
  title: string | null;
  image: string | null;
  bio: string | null;
  /** Across all of the instructor's courses; null when nobody has rated. */
  rating_avg: number | null;
  rating_count: number;
  learners_count: number;
  courses_count: number;
  /** Up to three, only courses this viewer can browse. */
  other_courses: InstructorOtherCourse[];
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
  require_completion: boolean;
}

export interface CohortSession {
  id: number;
  title: string;
  session_date: string;
  time_from: string | null;
  time_to: string | null;
  location: string | null;
  /** Derived by the API from the session's end (Figma 2027:97810). */
  duration_minutes: number | null;
  status: 'completed' | 'upcoming' | null;
  /** Ids of the course `units` this session covers (cohort schedule sheet, D-079). */
  content_ids: number[];
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

export type CourseDetailTab = 'overview' | 'curriculum' | 'instructor' | 'schedule';
