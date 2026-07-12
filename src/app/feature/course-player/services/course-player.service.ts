import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import {
  AnswerFeedback,
  AssessmentResults,
  AssessmentTakeState,
  AssessmentType,
  CourseLecture,
  CoursePlayerOutline,
  SubmittedAnswer,
} from '../models/course-player.models';

/**
 * Course Player API access — the in-course learning workspace (outline,
 * lecture content/progress) and the rich quiz/assignment submission flow
 * (courses/{course}/quizzes/{quiz}/... | courses/{course}/assignments/{assignment}/...).
 */
@Injectable({ providedIn: 'root' })
export class CoursePlayerService {
  private readonly api = inject(ApiService);

  getOutline(courseId: number): Observable<ApiResponse<CoursePlayerOutline>> {
    return this.api.get<CoursePlayerOutline>(`my/courses/${courseId}/outline`);
  }

  getLecture(courseId: number, lectureId: number): Observable<ApiResponse<CourseLecture>> {
    return this.api.get<CourseLecture>(`courses/${courseId}/lectures/${lectureId}`);
  }

  /**
   * The video/document/article "Did you complete this?" Yes/No prompt and
   * the link module's "Mark as complete" click all resolve to this single
   * `confirmed` boolean, overriding the legacy numeric-progress rule.
   */
  confirmLectureCompletion(courseId: number, lectureId: number, confirmed: boolean): Observable<ApiResponse<void>> {
    return this.api.post<void>(`courses/${courseId}/lectures/${lectureId}/progress`, { confirmed });
  }

  private segment(type: AssessmentType): string {
    return type === 'quiz' ? 'quizzes' : 'assignments';
  }

  take(
    type: AssessmentType,
    courseId: number,
    assessmentId: number,
  ): Observable<ApiResponse<AssessmentTakeState>> {
    return this.api.get<AssessmentTakeState>(
      `courses/${courseId}/${this.segment(type)}/${assessmentId}/take`,
    );
  }

  submitAnswer(
    type: AssessmentType,
    courseId: number,
    assessmentId: number,
    questionId: number,
    answer: SubmittedAnswer,
  ): Observable<ApiResponse<AnswerFeedback>> {
    return this.api.post<AnswerFeedback>(
      `courses/${courseId}/${this.segment(type)}/${assessmentId}/questions/${questionId}/answer`,
      answer,
    );
  }

  finish(
    type: AssessmentType,
    courseId: number,
    assessmentId: number,
  ): Observable<ApiResponse<AssessmentResults>> {
    return this.api.post<AssessmentResults>(
      `courses/${courseId}/${this.segment(type)}/${assessmentId}/finish`,
      {},
    );
  }

  getResults(
    type: AssessmentType,
    courseId: number,
    assessmentId: number,
  ): Observable<ApiResponse<AssessmentResults>> {
    return this.api.get<AssessmentResults>(
      `courses/${courseId}/${this.segment(type)}/${assessmentId}/results`,
    );
  }
}
