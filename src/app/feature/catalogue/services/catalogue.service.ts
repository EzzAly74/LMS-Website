import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { removeNullFilterProperties } from '../../../shared/utils/remove-null-filter-properties';
import { CatalogueCourse, CatalogueQuery, ScopeChip } from '../models/catalogue.models';

/** Enrolment outcomes returned by POST .../enrol. */
export interface EnrolmentResult {
  outcome: string;
  is_success: boolean;
  message_key: string;
  cohort?: { id: number; name: string; start_date: string } | null;
}

/**
 * Catalogue API access. Consumes the per-user learner web endpoints
 * (/api/v1/learner/academy/*), which reuse the backend Academy service layer.
 */
@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private readonly api = inject(ApiService);
  private readonly base = 'learner/academy';

  getCourses(query: CatalogueQuery): Observable<ApiResponse<CatalogueCourse[]>> {
    return this.api.get<CatalogueCourse[]>(`${this.base}/courses`, {
      params: removeNullFilterProperties({ ...query }),
    });
  }

  getScopes(): Observable<ApiResponse<ScopeChip[]>> {
    return this.api.get<ScopeChip[]>(`${this.base}/scopes`);
  }

  enrol(courseId: number, cohortId?: number): Observable<ApiResponse<EnrolmentResult>> {
    return this.api.post<EnrolmentResult>(`${this.base}/courses/${courseId}/enrol`, {
      cohort_id: cohortId ?? null,
    });
  }
}
