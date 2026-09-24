import { DatePipe, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { NotificationService } from '../../../../core/services/notification.service';
import { reloadOnLanguageChange } from '../../../../core/utils/reload-on-language-change';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { LearningCourse, SessionAttendance } from '../../../profile/models/profile.models';
import { ProfileService } from '../../../profile/services/profile.service';
import { CourseOutline } from '../../models/my-learnings.models';
import { MyLearningsService } from '../../services/my-learnings.service';

interface RatingLevel {
  value: number;
  labelKey: string;
}

/**
 * The 1-5 rating scale.
 *
 * W-13: this used to carry an emoji per level (rendered as a text character),
 * which breaks the "no emoji or text characters as icons" rule. It also did not
 * match the design: the Figma rating control is a STAR scale
 * (evaluation modal 2194:78022), and the post-rating display on this very
 * screen is "My Rating: * 4" (2181:114393). There is no emoji face scale
 * anywhere in the Figma file - the five faces were invented by the
 * implementation.
 *
 * No new asset was needed: `pi-star-fill` / `pi-star` are PrimeIcons, already a
 * project dependency and already used a few lines up in this same template for
 * the course rating.
 */
const RATING_LEVELS: RatingLevel[] = [
  { value: 1, labelKey: 'feature.profile.learnings.rating.very_unsatisfied' },
  { value: 2, labelKey: 'feature.profile.learnings.rating.unsatisfied' },
  { value: 3, labelKey: 'feature.profile.learnings.rating.neutral' },
  { value: 4, labelKey: 'feature.profile.learnings.rating.satisfied' },
  { value: 5, labelKey: 'feature.profile.learnings.rating.very_satisfied' },
];

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
  imports: [DatePipe, KeyValuePipe, RouterLink, TranslatePipe, BadgeComponent, ShimmerComponent],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly myLearnings = inject(MyLearningsService);
  private readonly profile = inject(ProfileService);
  private readonly translate = inject(TranslateService);
  private readonly notify = inject(NotificationService);

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

  protected readonly levels = RATING_LEVELS;

  /**
   * Whether the star at `value` renders filled.
   *
   * `draftRating` is `number | null`, so the comparison is done here rather
   * than in the template — under `strictTemplates` a null-unsafe `>=` in the
   * template is a build error, and the honest fix is to handle the null, not
   * to cast it away.
   */
  protected isStarFilled(value: number): boolean {
    return (this.draftRating() ?? 0) >= value;
  }
  protected readonly backLink = `/${LmsRoutes.MyLearnings}`;

  protected readonly inline = signal(false);
  private readonly _courseId = signal(0);

  protected readonly loading = signal(true);
  protected readonly outline = signal<CourseOutline | null>(null);
  private readonly _course = signal<LearningCourse | null>(null);
  protected readonly courseData = this._course.asReadonly();
  protected readonly sessions = signal<SessionAttendance[]>([]);

  protected readonly draftRating = signal<number | null>(null);
  protected readonly draftComment = signal('');
  protected readonly submitting = signal(false);
  protected readonly justRated = signal<number | null>(null);
  /** Neutral or worse (value ≤ 3) requires a comment before submitting (§7.7). */
  protected readonly commentRequired = computed(() => {
    const r = this.draftRating();
    return r !== null && r <= 3;
  });

  protected readonly myRating = computed(() => this.justRated() ?? this._course()?.rate ?? null);
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

  protected pickRating(value: number): void {
    this.draftRating.set(value);
  }

  protected submitRating(): void {
    const rating = this.draftRating();
    if (rating === null || this.submitting()) {
      return;
    }
    if (this.commentRequired() && !this.draftComment().trim()) {
      return;
    }
    this.submitting.set(true);
    this.profile.submitRating(this._courseId(), rating, this.draftComment().trim() || null).subscribe({
      next: () => {
        this.submitting.set(false);
        this.justRated.set(rating);
        this.notify.success(this.translate.instant('feature.profile.learnings.rating.thanks'));
      },
      error: () => this.submitting.set(false),
    });
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

    // Header info: use the course passed in inline, else fetch the list.
    if (this._course() === null) {
      this.profile.getLearnings().subscribe({
        next: (res) => {
          if (res.status === 'success' && res.result) {
            this._course.set(res.result.find((c) => c.id === id) ?? null);
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
