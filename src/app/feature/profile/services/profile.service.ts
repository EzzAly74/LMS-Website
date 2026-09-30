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
  WeekSchedule,
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

  getWeekSchedule(): Observable<ApiResponse<WeekSchedule>> {
    return this.api.get<WeekSchedule>(`${this.base}/schedule`);
  }

  getCertificates(): Observable<ApiResponse<ProfileCertificate[]>> {
    return this.api.get<ProfileCertificate[]>(`${this.base}/certificates`);
  }

  getSessions(courseId: number): Observable<ApiResponse<SessionAttendance[]>> {
    return this.api.get<SessionAttendance[]>(`${this.base}/courses/${courseId}/sessions`);
  }

  /** Download a certificate as a binary blob (authenticated via HttpClient). */
  downloadCertificate(certificateId: number): Observable<Blob> {
    return this.api.getBlob(`${this.base}/certificates/${certificateId}/download`);
  }

  /** Mark the learner present for a live session via passcode (mobile S-06 twin). */
  markPresent(
    courseId: number,
    sessionId: number | null,
    passcode: string,
  ): Observable<ApiResponse<unknown>> {
    return this.api.post(`${this.base}/attendance/mark`, {
      course_id: courseId,
      session_id: sessionId,
      passcode,
    });
  }
}
