/** Course delivery mode. */
export type DeliveryType = 'online' | 'offline' | 'hybrid' | 'external_link';

export type DeadlineSeverity = 'none' | 'warning' | 'critical' | 'closed';

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
  image: string | null;
  hours: number;
  has_certificate: boolean;
  category: CatalogueCategory | null;
  instructors: CatalogueInstructor[];
  qualifications: CatalogueQualification[];
  rating: CatalogueRating;
  next_cohort: NextCohort | null;
}

/** Scope chip (Tailored for Me / Explore All) from GET /learner/academy/scopes. */
export interface ScopeChip {
  key: string;
  label: string;
  count: number;
  is_all: boolean;
}

/** Query payload for the catalogue list. */
export interface CatalogueQuery {
  scope?: string;
  category_id?: number | null;
  search?: string | null;
  page?: number;
  per_page?: number;
}
