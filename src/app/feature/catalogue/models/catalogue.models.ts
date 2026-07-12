/** Course delivery mode. */
export type DeliveryType = 'online' | 'offline' | 'hybrid' | 'external_link';

export type CourseLevel = 'beginner' | 'intermediate' | 'professional';

/** Bucketed calendar duration, used by the Duration filter. */
export type DurationBucket = '1_2_weeks' | '2_4_weeks' | '4_8_weeks' | '8_plus_weeks';

export type SortOption = 'most_relevant' | 'highest_rated' | 'soonest_start' | 'newest';

export type DeadlineSeverity = 'none' | 'warning' | 'critical' | 'closed';

/**
 * Enrolment CTA state resolved server-side (App\Enums\Mobile\CourseCtaState) so
 * the frontend never re-derives enrolment-closed/already-enrolled business
 * rules from raw cohort/seat data.
 */
export type CourseCtaState =
  | 'enrol_now'
  | 'get_notified'
  | 'enrolled_view_learning'
  | 'unavailable'
  | 'not_enrollable';

export interface CourseCta {
  state: CourseCtaState;
  label_key: string;
  enabled: boolean;
}

export interface CatalogueCategory {
  id: number;
  name: string;
}

export interface CatalogueInstructor {
  id: number;
  name: string;
  image: string | null;
}

export interface CatalogueQualification {
  id: number;
  name: string;
}

export interface CatalogueRating {
  avg: number;
  count: number;
  sentiment: string;
}

export interface NextCohort {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  capacity: number | null;
  enrolled_count: number;
  seats_left: number | null;
  enrolment_closes_at: string | null;
  days_until_deadline: number | null;
  days_until_start: number | null;
  deadline_severity: DeadlineSeverity;
}

/** A course card as returned by GET /learner/academy/courses. */
export interface CatalogueCourse {
  id: number;
  title: string;
  description: string;
  course_type: DeliveryType;
  level: CourseLevel | null;
  duration_weeks: number | null;
  image: string | null;
  hours: number;
  has_certificate: boolean;
  category: CatalogueCategory | null;
  instructors: CatalogueInstructor[];
  qualifications: CatalogueQualification[];
  rating: CatalogueRating;
  next_cohort: NextCohort | null;
  cta: CourseCta;
}

/** Scope chip (Tailored for Me / Explore All) from GET /learner/academy/scopes. */
export interface ScopeChip {
  key: string;
  label: string;
  count: number;
  is_all: boolean;
}

/** Per-option result count for a filter section, keyed by option value. */
export type FilterCounts = Record<string, number>;

/** Filter facet counts returned alongside the paginated course list. */
export interface CatalogueFilterMeta {
  type: FilterCounts;
  level: FilterCounts;
  duration: FilterCounts;
}

/** Query payload for the catalogue list. */
export interface CatalogueQuery {
  scope?: string;
  category_id?: number | null;
  search?: string | null;
  type?: DeliveryType[];
  level?: CourseLevel[];
  duration?: DurationBucket[];
  job_role_id?: number[];
  sort?: SortOption;
  page?: number;
  per_page?: number;
}
