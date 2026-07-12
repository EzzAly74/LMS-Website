import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { NotificationService } from '../../../../core/services/notification.service';
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
import { LessonViewerComponent } from '../lesson-viewer/lesson-viewer.component';
import { QuizRunnerComponent } from '../quiz-runner/quiz-runner.component';

type ViewMode = 'lecture' | 'quiz' | 'results';

@Component({
  selector: 'app-course-player-page',
  standalone: true,
  imports: [TranslatePipe, RouterLink, BadgeComponent, LessonViewerComponent, QuizRunnerComponent, AssessmentResultsComponent],
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

  protected readonly currentQuestion = computed(() => {
    const take = this.currentTake();
    return take ? (take.questions[this.currentQuestionIndex()] ?? null) : null;
  });

  protected readonly isLastQuestion = computed(() => {
    const take = this.currentTake();
    return !!take && this.currentQuestionIndex() === take.questions.length - 1;
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

  private loadOutline(silent = false): void {
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
        this.expandedWeeks.set(new Set(res.result.weeks.map((w) => w.label)));

        if (!silent) {
          const active = this.findResumeItem(res.result);
          if (active) {
            this.selectItem(active);
          }
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
