import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { NotificationService } from '../../../../core/services/notification.service';
import { reloadOnLanguageChange } from '../../../../core/utils/reload-on-language-change';
import { saveBlob } from '../../../../core/utils/save-blob';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import {
  AnswerFeedback,
  AssessmentResults,
  AssessmentTakeState,
  AssessmentType,
  CourseLecture,
  CoursePlayerOutline,
  PlaylistItem,
  SubmittedAnswer,
} from '../../models/course-player.models';
import { CoursePlayerService } from '../../services/course-player.service';
import { AssessmentResultsComponent } from '../assessment-results/assessment-results.component';
import { CoursePlayerSkeletonComponent } from '../course-player-skeleton/course-player-skeleton.component';
import { LessonViewerComponent } from '../lesson-viewer/lesson-viewer.component';
import { QuizRunnerComponent } from '../quiz-runner/quiz-runner.component';

type ViewMode = 'lecture' | 'quiz' | 'results';

@Component({
  selector: 'app-course-player-page',
  standalone: true,
  imports: [
    TranslatePipe,
    RouterLink,
    BadgeComponent,
    CoursePlayerSkeletonComponent,
    LessonViewerComponent,
    QuizRunnerComponent,
    AssessmentResultsComponent,
  ],
  templateUrl: './course-player-page.component.html',
  styleUrl: './course-player-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursePlayerPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CoursePlayerService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  protected readonly myLearningsRoute = `/${LmsRoutes.MyLearnings}`;
  protected readonly loading = signal(true);
  protected readonly outline = signal<CoursePlayerOutline | null>(null);
  protected readonly expandedWeeks = signal<Set<string>>(new Set());

  protected readonly activeItem = signal<PlaylistItem | null>(null);
  protected readonly viewMode = signal<ViewMode>('lecture');

  protected readonly currentLecture = signal<CourseLecture | null>(null);
  protected readonly currentTake = signal<AssessmentTakeState | null>(null);
  protected readonly currentQuestionIndex = signal(0);
  protected readonly currentFeedback = signal<AnswerFeedback | null>(null);
  protected readonly currentResults = signal<AssessmentResults | null>(null);

  /** Running "Score  XX/YY" (Figma 913:47077) — persists across questions,
   *  unlike `currentFeedback` which resets whenever the learner moves on. */
  protected readonly runningScore = signal<number | null>(null);
  protected readonly quizMaxScore = signal<number | null>(null);

  /** File questions (D-064): an upload in flight, and a 422 shown under the drop zone. */
  protected readonly fileBusy = signal(false);
  protected readonly fileError = signal<string | null>(null);
  /** Results: the question whose file is downloading or being replaced. */
  protected readonly busyQuestionId = signal<number | null>(null);
  protected readonly replaceError = signal<{ questionId: number; message: string } | null>(null);

  protected readonly currentQuestion = computed(() => {
    const take = this.currentTake();
    return take ? (take.questions[this.currentQuestionIndex()] ?? null) : null;
  });

  protected readonly isLastQuestion = computed(() => {
    const take = this.currentTake();
    return !!take && this.currentQuestionIndex() === take.questions.length - 1;
  });

  /** Quiz or Assignment tag (FG-48). */
  protected readonly assessmentKind = computed<'quiz' | 'assignment' | null>(() => {
    const item = this.activeItem();
    return item && item.kind !== 'lecture' ? item.kind : null;
  });

  protected readonly assessmentTypeLabel = computed(() => {
    const item = this.activeItem();
    if (!item || item.kind === 'lecture') {
      return '';
    }
    return this.translate.instant(
      item.kind === 'assignment' ? 'feature.course_player.quiz.assignment_title' : 'feature.course_player.quiz.title',
    );
  });

  protected readonly flatItems = computed<PlaylistItem[]>(
    () => this.outline()?.weeks.flatMap((w) => w.items) ?? [],
  );

  protected readonly activeIndex = computed(() => {
    const active = this.activeItem();
    if (!active) {
      return -1;
    }
    return this.flatItems().findIndex((i) => i.kind === active.kind && i.id === active.id);
  });

  protected readonly hasPrevious = computed(() => this.activeIndex() > 0);
  protected readonly hasNext = computed(() => {
    const idx = this.activeIndex();
    return idx >= 0 && idx < this.flatItems().length - 1;
  });

  private courseId!: number;

  protected goPrevious(): void {
    const idx = this.activeIndex();
    if (idx > 0) {
      this.selectItem(this.flatItems()[idx - 1]);
    }
  }

  protected goNext(): void {
    const idx = this.activeIndex();
    if (idx >= 0 && idx < this.flatItems().length - 1) {
      this.selectItem(this.flatItems()[idx + 1]);
    }
  }

  constructor() {
    // Backend lecture/quiz text is localized via Accept-Language — a switch
    // shows the full page skeleton (like the initial load) and refetches the
    // outline, then re-opens whichever item was active so the learner lands
    // back where they were, just in the new language.
    reloadOnLanguageChange(() => {
      const activeBefore = this.activeItem();
      this.loadOutline(false, activeBefore ?? undefined);
    });
  }

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
    this.loadOutline();
  }

  protected isWeekExpanded(label: string): boolean {
    return this.expandedWeeks().has(label);
  }

  protected toggleWeek(label: string): void {
    const next = new Set(this.expandedWeeks());
    next.has(label) ? next.delete(label) : next.add(label);
    this.expandedWeeks.set(next);
  }

  /* ── Sidebar state (Figma 900:45220) ───────────────────────────────────── */

  /** A week is "complete" when every module in it is done → green check. */
  protected isWeekComplete(week: { items: PlaylistItem[] }): boolean {
    return week.items.length > 0 && week.items.every((i) => i.completed);
  }

  /** The week that holds the currently open item → teal label (Figma). */
  protected isWeekActive(week: { items: PlaylistItem[] }): boolean {
    return week.items.some((i) => this.isItemActive(i));
  }

  protected isItemActive(item: PlaylistItem): boolean {
    const active = this.activeItem();
    return !!active && active.kind === item.kind && active.id === item.id;
  }

  /** Leading icon per module type — maps to the exported Figma icon assets. */
  protected itemIcon(item: PlaylistItem): 'play' | 'file' | 'external' | 'quiz' {
    if (item.kind !== 'lecture') {
      return 'quiz';
    }
    if (item.content_type === 'video') {
      return 'play';
    }
    if (item.content_type === 'link') {
      return 'external';
    }
    return 'file';
  }

  /** Quiz/assignment items use an orange (status-hold) accent instead of the
   *  teal used for lecture modules (Figma 1206:18606 — active Quiz row). */
  protected isQuizKind(item: PlaylistItem): boolean {
    return item.kind !== 'lecture';
  }

  protected selectItem(item: PlaylistItem): void {
    this.activeItem.set(item);
    if (item.kind === 'lecture') {
      this.viewMode.set('lecture');
      this.loadLecture(item.id);
    } else {
      this.viewMode.set('quiz');
      this.currentResults.set(null);
      this.currentFeedback.set(null);
      this.loadTake(item.kind, item.id);
    }
  }

  protected onConfirmCompletion(confirmed: boolean): void {
    this.markLectureComplete(confirmed);
  }

  protected onMarkComplete(): void {
    this.markLectureComplete(true);
  }

  protected onSubmitAnswer(answer: SubmittedAnswer): void {
    const item = this.activeItem();
    const take = this.currentTake();
    const question = this.currentQuestion();
    if (!item || item.kind === 'lecture' || !take || !question) {
      return;
    }
    this.service.submitAnswer(item.kind, this.courseId, item.id, question.id, answer).subscribe({
      next: (res) => {
        if (res.status !== 'success' || !res.result) {
          return;
        }
        const feedback = res.result;
        this.currentFeedback.set(feedback);
        this.runningScore.set(feedback.running_total_score);

        const updatedQuestions = [...take.questions];
        updatedQuestions[this.currentQuestionIndex()] = {
          ...question,
          is_answered: true,
          my_answer: 'order' in answer ? { order: answer.order } : { value: answer.value },
        };
        this.currentTake.set({ ...take, questions: updatedQuestions });

        if (feedback.finalized && feedback.results) {
          this.currentResults.set(feedback.results);
          this.viewMode.set('results');
          this.loadOutline(true);
        }
      },
      error: () => this.showError(),
    });
  }

  /** File question: the file goes up only on "Submit Assignment". */
  protected onSubmitFile(file: File): void {
    const item = this.activeItem();
    const take = this.currentTake();
    const question = this.currentQuestion();
    if (!item || item.kind !== 'assignment' || !take || !question || this.fileBusy()) {
      return;
    }
    this.fileBusy.set(true);
    this.fileError.set(null);
    this.service.submitFile(this.courseId, item.id, question.id, file).subscribe({
      next: (res) => {
        this.fileBusy.set(false);
        const feedback = res.result;
        if (res.status !== 'success' || !feedback) {
          return;
        }
        const updated = [...take.questions];
        updated[this.currentQuestionIndex()] = { ...question, is_answered: true, my_file: feedback.my_file ?? null };
        this.currentTake.set({ ...take, questions: updated });

        if (feedback.finalized) {
          this.openResults(item.id, feedback.results);
          this.loadOutline(true);
        } else if (this.hasNextQuestion()) {
          this.onNextQuestion();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.fileBusy.set(false);
        if (err.status === 422) {
          this.fileError.set(this.validationMessage(err));
        }
      },
    });
  }

  /** Results: replace a file that no person has scored yet (D-064). */
  protected onReplaceFile(event: { questionId: number; file: File }): void {
    const item = this.activeItem();
    if (!item || item.kind !== 'assignment' || this.busyQuestionId() !== null) {
      return;
    }
    this.busyQuestionId.set(event.questionId);
    this.replaceError.set(null);
    this.service.submitFile(this.courseId, item.id, event.questionId, event.file).subscribe({
      next: () => {
        this.busyQuestionId.set(null);
        this.notify.success(this.translate.instant('feature.course_player.file.replaced'));
        this.openResults(item.id, null);
      },
      error: (err: HttpErrorResponse) => {
        this.busyQuestionId.set(null);
        if (err.status === 422) {
          this.replaceError.set({ questionId: event.questionId, message: this.validationMessage(err) });
        } else if (err.status === 409) {
          this.openResults(item.id, null); // scored meanwhile: show the locked result
        }
      },
    });
  }

  protected onDownloadAttachment(): void {
    const item = this.activeItem();
    const question = this.currentQuestion();
    if (item?.kind === 'assignment' && question) {
      this.download(this.service.downloadAttachment(this.courseId, item.id, question.id), question.attachment?.name ?? 'attachment');
    }
  }

  protected onDownloadMyFile(questionId?: number): void {
    const item = this.activeItem();
    const id = questionId ?? this.currentQuestion()?.id;
    if (item?.kind !== 'assignment' || id === undefined || this.busyQuestionId() !== null) {
      return;
    }
    const name = this.currentResults()?.answers.find((a) => a.question_id === id)?.my_file?.name
      ?? this.currentQuestion()?.my_file?.name ?? 'answer';
    this.busyQuestionId.set(id);
    this.download(this.service.downloadMyFile(this.courseId, item.id, id), name, () => this.busyQuestionId.set(null));
  }

  private download(request: Observable<Blob>, filename: string, done?: () => void): void {
    request.subscribe({
      next: (blob) => {
        saveBlob(blob, filename);
        done?.();
      },
      error: () => {
        done?.();
        this.notify.error(this.translate.instant('feature.course_player.file.download_failed'));
      },
    });
  }

  private validationMessage(err: HttpErrorResponse): string {
    const body = err.error as { message?: string; errors?: Record<string, string[]> } | null;
    return body?.errors?.['file']?.[0] ?? body?.message ?? this.translate.instant('common.error_generic');
  }

  /** Show results, fetching them unless the finalizing answer carried them. */
  private openResults(assignmentId: number, results: AssessmentResults | null): void {
    this.viewMode.set('results');
    if (results) {
      this.currentResults.set(results);
      return;
    }
    this.service.getResults('assignment', this.courseId, assignmentId).subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) {
          this.currentResults.set(res.result);
        }
      },
      error: () => this.showError(),
    });
  }

  protected onNextQuestion(): void {
    if (this.hasNextQuestion()) {
      this.currentQuestionIndex.update((i) => i + 1);
      this.currentFeedback.set(null);
    }
  }

  protected onFinishAssessment(): void {
    const item = this.activeItem();
    if (!item || item.kind === 'lecture') {
      return;
    }
    this.viewMode.set('results');
    this.service.finish(item.kind, this.courseId, item.id).subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) {
          this.currentResults.set(res.result);
        }
      },
      error: () => this.showError(),
    });
    this.loadOutline(true);
  }

  private hasNextQuestion(): boolean {
    const take = this.currentTake();
    return !!take && this.currentQuestionIndex() < take.questions.length - 1;
  }

  /** `resumeItem` overrides the default "resume where the learner left off"
   * pick — used to reopen the same item after a locale-triggered reload. */
  private loadOutline(silent = false, resumeItem?: PlaylistItem): void {
    if (!silent) {
      this.loading.set(true);
    }
    this.service.getOutline(this.courseId).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.status !== 'success' || !res.result) {
          return;
        }
        this.outline.set(res.result);

        const active = resumeItem ?? this.findResumeItem(res.result);
        // Figma opens only the active week; the rest stay collapsed.
        const activeWeek = active
          ? res.result.weeks.find((w) =>
              w.items.some((i) => i.kind === active.kind && i.id === active.id),
            )
          : null;
        const openLabels = activeWeek
          ? [activeWeek.label]
          : res.result.weeks.slice(0, 1).map((w) => w.label);
        this.expandedWeeks.set(new Set(openLabels));

        if (!silent && active) {
          this.selectItem(active);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  private findResumeItem(outline: CoursePlayerOutline): PlaylistItem | null {
    const flat = outline.weeks.flatMap((w) => w.items);
    return flat.find((i) => i.active) ?? flat.find((i) => !i.completed) ?? flat[0] ?? null;
  }

  private loadLecture(lectureId: number): void {
    this.service.getLecture(this.courseId, lectureId).subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) {
          this.currentLecture.set(res.result);
        }
      },
      error: () => this.showError(),
    });
  }

  private loadTake(kind: AssessmentType, assessmentId: number): void {
    this.service.take(kind, this.courseId, assessmentId).subscribe({
      next: (res) => {
        if (res.status !== 'success' || !res.result) {
          return;
        }
        this.currentTake.set(res.result);
        this.quizMaxScore.set(res.result.quiz.total_score);
        this.fileError.set(null);
        // A submitted assignment opens on its results ("Review Results",
        // 2003:79618), where a file can still be replaced until scored.
        if (kind === 'assignment' && res.result.submission_status === 'submitted') {
          this.openResults(assessmentId, null);
          return;
        }
        // The take endpoint doesn't return an accumulated score for a
        // resumed submission — 0 is the correct value for a fresh attempt,
        // and updates immediately once the learner answers anything.
        this.runningScore.set(0);
        const resumeId = res.result.resume_question_id;
        const resumeIndex = resumeId ? res.result.questions.findIndex((q) => q.id === resumeId) : -1;
        this.currentQuestionIndex.set(resumeIndex >= 0 ? resumeIndex : 0);
      },
      error: () => this.showError(),
    });
  }

  private markLectureComplete(confirmed: boolean): void {
    const lecture = this.currentLecture();
    if (!lecture) {
      return;
    }
    this.service.confirmLectureCompletion(this.courseId, lecture.id, confirmed).subscribe({
      next: () => {
        this.currentLecture.set({ ...lecture, completed: confirmed });
        this.loadOutline(true);
      },
      error: () => this.showError(),
    });
  }

  private showError(): void {
    this.notify.error(this.translate.instant('common.error_generic'));
  }
}
