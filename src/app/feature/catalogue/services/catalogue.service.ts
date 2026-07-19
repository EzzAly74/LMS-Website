import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, PaginationMeta } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { removeNullFilterProperties } from '../../../shared/utils/remove-null-filter-properties';
import { CatalogueCourse, CatalogueFilterMeta, CatalogueQuery, ScopeChip } from '../models/catalogue.models';

/** Enrolment outcomes returned by POST .../enrol. */
export interface EnrolmentResult {
  outcome: string;
  is_success: boolean;
  message_key: string;
  cohort?: { id: number; name: string; start_date: string } | null;
}

/** GET .../courses response — same envelope as ApiResponse, with filter facet counts on meta. */
export type CatalogueListResponse = Omit<ApiResponse<CatalogueCourse[]>, 'meta'> & {
  meta?: PaginationMeta & { filters?: CatalogueFilterMeta };
};

/**
 * Catalogue API access. Consumes the per-user learner web endpoints
 * (/api/v1/learner/academy/*), which reuse the backend Academy service layer.
 */
@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private readonly api = inject(ApiService);
  private readonly base = 'learner/academy';

  getCourses(query: CatalogueQuery): Observable<CatalogueListResponse> {
    return this.api.get<CatalogueCourse[]>(`${this.base}/courses`, {
      params: removeNullFilterProperties({ ...query }),
    }) as Observable<CatalogueListResponse>;
  }

  getScopes(): Observable<ApiResponse<ScopeChip[]>> {
    return this.api.get<ScopeChip[]>(`${this.base}/scopes`);
  }

  enrol(courseId: number, cohortId?: number): Observable<ApiResponse<EnrolmentResult>> {
    return this.api.post<EnrolmentResult>(`${this.base}/courses/${courseId}/enrol`, {
      cohort_id: cohortId ?? null,
    });
  }

  notifyMe(courseId: number): Observable<ApiResponse<void>> {
    return this.api.post<void>(`${this.base}/courses/${courseId}/notify-me`, {});
  }

  /** Public job-title lookup, used to build the Job Role filter chips. */
  getJobRoles(): Observable<ApiResponse<{ id: number; name: string }[]>> {
    return this.api.get<{ id: number; name: string }[]>('job-titles/active');
  }
}
