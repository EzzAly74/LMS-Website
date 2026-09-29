import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

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
    return this.api
      .get<AssessmentTakeState & { assignment?: AssessmentTakeState['quiz'] }>(
        `courses/${courseId}/${this.segment(type)}/${assessmentId}/take`,
      )
      .pipe(
        // B-140: the assignment endpoint names the meta `assignment`.
        map((res) => (res.result && !res.result.quiz && res.result.assignment
          ? { ...res, result: { ...res.result, quiz: res.result.assignment } }
          : res)),
      );
  }

  submitAnswer(
    type: AssessmentType,
    courseId: number,
    assessmentId: number,
    questionId: number,
    answer: SubmittedAnswer,
  ): Observable<ApiResponse<AnswerFeedback>> {
    return this.api
      .post<AnswerFeedback>(
        `courses/${courseId}/${this.segment(type)}/${assessmentId}/questions/${questionId}/answer`,
        answer,
      )
      .pipe(map(normaliseFeedback));
  }

  /**
   * File question (D-064): multipart `file` on the same answer route. Allowed
   * until a person scores it, also after the attempt is submitted.
   */
  submitFile(courseId: number, assignmentId: number, questionId: number, file: File): Observable<ApiResponse<AnswerFeedback>> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.api
      .post<AnswerFeedback>(`courses/${courseId}/assignments/${assignmentId}/questions/${questionId}/answer`, body)
      .pipe(map(normaliseFeedback));
  }

  /** The instructor's template for a file question. */
  downloadAttachment(courseId: number, assignmentId: number, questionId: number): Observable<Blob> {
    return this.api.getBlob(`courses/${courseId}/assignments/${assignmentId}/questions/${questionId}/attachment`);
  }

  /** The learner's own uploaded answer. */
  downloadMyFile(courseId: number, assignmentId: number, questionId: number): Observable<Blob> {
    return this.api.getBlob(`courses/${courseId}/assignments/${assignmentId}/questions/${questionId}/my-file`);
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

/** B-140: the assignment endpoint names the total `assignment_max_score`. */
function normaliseFeedback(res: ApiResponse<AnswerFeedback>): ApiResponse<AnswerFeedback> {
  const r = res.result as (AnswerFeedback & { assignment_max_score?: number }) | null | undefined;
  if (r && r.quiz_max_score === undefined && r.assignment_max_score !== undefined) {
    return { ...res, result: { ...r, quiz_max_score: r.assignment_max_score } };
  }
  return res;
}
