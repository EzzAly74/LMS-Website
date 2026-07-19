import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import {
  CompletedCourse,
  LearningCourse,
  ProfileCertificate,
  ProfileSummary,
  QualificationProgress,
  SessionAttendance,
} from '../models/profile.models';

/**
 * Learner Profile dashboard API access (/api/v1/learner/profile/*).
 *
 * Header counters + the rich per-qualification course breakdown are web-only
 * projections (ProfileController); the learnings / certificates / sessions /
 * rating shapes reuse the shared mobile service layer under per-user auth.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);
  private readonly base = 'learner/profile';

  getSummary(): Observable<ApiResponse<ProfileSummary>> {
    return this.api.get<ProfileSummary>(`${this.base}/summary`);
  }

  getQualifications(): Observable<ApiResponse<QualificationProgress[]>> {
    return this.api.get<QualificationProgress[]>(`${this.base}/qualifications`);
  }

  getLearnings(): Observable<ApiResponse<LearningCourse[]>> {
    return this.api.get<LearningCourse[]>(`${this.base}/learnings`);
  }

  getCompleted(): Observable<ApiResponse<CompletedCourse[]>> {
    return this.api.get<CompletedCourse[]>(`${this.base}/completed`);
  }

  getCertificates(): Observable<ApiResponse<ProfileCertificate[]>> {
    return this.api.get<ProfileCertificate[]>(`${this.base}/certificates`);
  }

  getSessions(courseId: number): Observable<ApiResponse<SessionAttendance[]>> {
    return this.api.get<SessionAttendance[]>(`${this.base}/courses/${courseId}/sessions`);
  }

  submitRating(
    courseId: number,
    rating: number,
    comment: string | null,
  ): Observable<ApiResponse<{ id: number; rating: number }>> {
    return this.api.post(`${this.base}/courses/${courseId}/rating`, { rating, comment });
  }
}
