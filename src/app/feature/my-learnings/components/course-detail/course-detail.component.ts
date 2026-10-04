import { DatePipe, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { reloadOnLanguageChange } from '../../../../core/utils/reload-on-language-change';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { LearningCourse, SessionAttendance } from '../../../profile/models/profile.models';
import { ProfileService } from '../../../profile/services/profile.service';
import { CourseOutline, EvaluationForm, EvaluationSubmitResult } from '../../models/my-learnings.models';
import { MyLearningsService } from '../../services/my-learnings.service';
import { EvaluationDialogComponent } from '../evaluation-dialog/evaluation-dialog.component';
import { PluralKeyPipe } from '../../../../shared/pipes/plural-key.pipe';

/**
 * Course Detail (Figma 851-44908 / 951-48857). Rendered INLINE inside the
 * profile "My Learnings" tab (master-detail) — reached from a Current card's
 * "View Details" — so it keeps the profile header/tabs and the shared right
 * rail (My Attendance). Header (type · sessions · instructor · Continue), the
 * week-grouped module outline, and the rating widget with already-rated state.
 *
 * `inline` mode (default when a `course`/`courseId` input is supplied) hides
 * the standalone back-link/own rail and emits `back` instead; the component
 * still supports a routed fallback for deep links.
 */
@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [PluralKeyPipe, DatePipe, KeyValuePipe, RouterLink, TranslatePipe, BadgeComponent, ShimmerComponent, EvaluationDialogComponent],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly myLearnings = inject(MyLearningsService);
  private readonly profile = inject(ProfileService);

  /** Inline usage: the selected course + a back handler (master-detail). */
  @Input() set courseId(value: number | null | undefined) {
    if (value) {
      this._courseId.set(value);
      this.inline.set(true);
      this.load();
    }
  }
  @Input() set course(value: LearningCourse | null) {
    if (value) {
      this._course.set(value);
    }
  }
  @Output() back = new EventEmitter<void>();

  protected readonly backLink = `/${LmsRoutes.MyLearnings}`;

  protected readonly inline = signal(false);
  private readonly _courseId = signal(0);

  protected readonly loading = signal(true);
  protected readonly outline = signal<CourseOutline | null>(null);
  private readonly _course = signal<LearningCourse | null>(null);
  protected readonly courseData = this._course.asReadonly();
  protected readonly sessions = signal<SessionAttendance[]>([]);

  /**
   * Course evaluation (Figma 2078:104643 "Evaluate course · Add My Feedback").
   * The row shows only when the course is evaluated, this learner has not
   * answered yet, there is something to answer and an instructor to name.
   */
  protected readonly evaluationForm = signal<EvaluationForm | null>(null);
  protected readonly evaluationOpen = signal(false);
  protected readonly evaluationDone = signal(false);
  protected readonly canEvaluate = computed(() => {
    const f = this.evaluationForm();
    return !!f && !this.evaluationDone() && !f.already_evaluated && f.instructors.length > 0
      && f.evaluation_categories.some((t) => t.questions.length > 0);
  });

  protected openEvaluation(): void {
    this.evaluationOpen.set(true);
  }

  /**
   * Answered (or already answered elsewhere): the row goes, as in Figma
   * 2181:114393, and "My Rating" shows the rating the evaluation set.
   */
  protected onEvaluated(result: EvaluationSubmitResult | null): void {
    this.evaluationOpen.set(false);
    this.evaluationDone.set(true);
    if (result?.rating != null) this.ratedNow.set(result);
  }

  /** The rating the evaluation just set, until the course is reloaded. */
  private readonly ratedNow = signal<EvaluationSubmitResult | null>(null);

  /**
   * "My Rating": taken from the learner's course evaluation (the rounded
   * average of their star and 1-5 answers, human 2026-09-30). The old inline
   * "How are you finding this course?" widget is gone.
   */
  protected readonly myRating = computed(() => this.ratedNow()?.rating ?? this._course()?.rate ?? null);
  protected readonly myRatingLabel = computed(() =>
    this.ratedNow() ? this.ratedNow()?.rate_label ?? null : this._course()?.rate_label ?? null,
  );
  protected readonly attended = computed(() => this.sessions().filter((s) => s.attended).length);
  /** Future-dated, not-yet-attended sessions aren't "absent" (spec review). */
  protected readonly absent = computed(
    () => this.sessions().filter((s) => !s.attended && !this.sessionIsUpcoming(s)).length,
  );

  protected sessionIsUpcoming(s: SessionAttendance): boolean {
    return !!s.session_date && new Date(s.session_date) > new Date();
  }
  protected readonly hasModules = computed(() => (this.outline()?.modules_total ?? 0) > 0);
  protected readonly instructorNames = computed(() =>
    (this._course()?.instructors ?? []).map((i) => i.name).join(', '),
  );

  constructor() {
    reloadOnLanguageChange(() => this.load());
  }

  ngOnInit(): void {
    // Routed fallback (deep link) — no input was provided.
    if (this._courseId() === 0) {
      const param = Number(this.route.snapshot.paramMap.get('id'));
      if (param) {
        this._courseId.set(param);
        this.load();
      }
    }
  }

  protected onBack(): void {
    this.back.emit();
  }

  /**
   * "Continue Learning" → open the actual course player. Previously an
   * `<a href="#cd-modules">`, which in this SPA navigated to `/#cd-modules`
   * (root + dangling fragment) instead of resuming the course.
   */
  protected continueLearning(): void {
    const id = this._courseId();
    if (id) {
      this.router.navigate(['/', LmsRoutes.MyLearnings, id, 'learn']);
    }
  }

  /** Completed items within a single module group (per-module "x/y"). */
  protected completedIn(items: { completed: boolean }[]): number {
    return items.filter((i) => i.completed).length;
  }

  protected contentTypeKey(item: { kind: string; content_type: string | null }): string {
    if (item.kind === 'quiz') {
      return 'feature.my_learnings.content.quiz';
    }
    if (item.kind === 'assignment') {
      return 'feature.my_learnings.content.assignment';
    }
    const type = (item.content_type ?? 'document').toLowerCase();
    return `feature.my_learnings.content.${type}`;
  }

  private load(): void {
    const id = this._courseId();
    if (!id) {
      return;
    }
    this.loading.set(true);

    this.myLearnings.getOutline(id).subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) {
          this.outline.set(res.result);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Evaluation form: asked for only when the course offers one.
    // Per course: the inline detail is reused when the learner picks another one.
    this.evaluationForm.set(null);
    this.evaluationDone.set(false);
    this.ratedNow.set(null);
    const loadEvaluation = (course: LearningCourse | null) => {
      if (!course?.evaluation?.available) return;
      this.myLearnings.getEvaluation(id).subscribe({
        next: (res) => this.evaluationForm.set(res.status === 'success' && res.result ? res.result : null),
        error: () => this.evaluationForm.set(null),
      });
    };
    if (this._course() !== null) loadEvaluation(this._course());

    // Header info: use the course passed in inline, else fetch the list.
    if (this._course() === null) {
      this.profile.getLearnings().subscribe({
        next: (res) => {
          if (res.status === 'success' && res.result) {
            this._course.set(res.result.find((c) => c.id === id) ?? null);
            loadEvaluation(this._course());
          }
        },
      });
    }

    // Standalone/routed mode renders its own attendance rail; inline mode
    // relies on the shared profile sidebar, so it needn't fetch sessions.
    if (!this.inline()) {
      this.profile.getSessions(id).subscribe({
        next: (res) => this.sessions.set(res.status === 'success' && res.result ? res.result : []),
      });
    }
  }
}
