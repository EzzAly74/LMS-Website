import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { EnrolmentResult } from '../../catalogue/services/catalogue.service';
import { CourseDetail } from '../models/course-detail.models';

/** Course Detail API access — GET/POST .../learner/academy/courses/{id}. */
@Injectable({ providedIn: 'root' })
export class CourseDetailService {
  private readonly api = inject(ApiService);
  private readonly base = 'learner/academy';

  getCourse(id: number): Observable<ApiResponse<CourseDetail>> {
    return this.api.get<CourseDetail>(`${this.base}/courses/${id}`);
  }

  enrol(courseId: number, cohortId?: number): Observable<ApiResponse<EnrolmentResult>> {
    return this.api.post<EnrolmentResult>(`${this.base}/courses/${courseId}/enrol`, {
      cohort_id: cohortId ?? null,
    });
  }

  notifyMe(courseId: number): Observable<ApiResponse<void>> {
    return this.api.post<void>(`${this.base}/courses/${courseId}/notify-me`, {});
  }
}
