import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { ActiveCourse, CourseOutline, EvaluationAnswers, EvaluationForm } from '../models/my-learnings.models';

/** My Learnings dashboard API access — GET my/learnings (learner-facing composite). */
@Injectable({ providedIn: 'root' })
export class MyLearningsService {
  private readonly api = inject(ApiService);

  getActiveCourses(): Observable<ApiResponse<ActiveCourse[]>> {
    return this.api.get<ActiveCourse[]>('my/learnings');
  }

  /** Course-player/detail outline: module groups + progress + certificate status. */
  getOutline(courseId: number): Observable<ApiResponse<CourseOutline>> {
    return this.api.get<CourseOutline>(`my/courses/${courseId}/outline`);
  }

  /** The course evaluation form (templates + questions) and whether this learner already answered it. */
  getEvaluation(courseId: number): Observable<ApiResponse<EvaluationForm>> {
    return this.api.get<EvaluationForm>(`courses/${courseId}/evaluate`);
  }

  /** Submit the evaluation once (409 if already answered). Optional questions left blank are left out. */
  submitEvaluation(courseId: number, instructorId: number, answers: EvaluationAnswers): Observable<ApiResponse<unknown>> {
    return this.api.post(`courses/${courseId}/evaluate`, { instructor_id: instructorId, questions: answers });
  }

  /** Download an earned certificate as a binary blob (authenticated). */
  downloadCertificate(certificateId: number): Observable<Blob> {
    return this.api.getBlob(`learner/profile/certificates/${certificateId}/download`);
  }
}
