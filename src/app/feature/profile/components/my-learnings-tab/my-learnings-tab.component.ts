import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { NotificationService } from '../../../../core/services/notification.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { EmptyStateComponent, EmptyStateConfig } from '../../../../shared/components/empty-state/empty-state.component';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { CompletedCourse, LearningCourse, LearningStatus } from '../../models/profile.models';
import { ProfileService } from '../../services/profile.service';

interface RatingFace {
  value: number;
  emoji: string;
  labelKey: string;
}

// Emoji + labels match Figma node 861:44286 exactly (Very Unsatisfied … Very Satisfied).
const RATING_FACES: RatingFace[] = [
  { value: 1, emoji: '😔', labelKey: 'feature.profile.learnings.rating.very_unsatisfied' },
  { value: 2, emoji: '🙁', labelKey: 'feature.profile.learnings.rating.unsatisfied' },
  { value: 3, emoji: '😐', labelKey: 'feature.profile.learnings.rating.neutral' },
  { value: 4, emoji: '🙂', labelKey: 'feature.profile.learnings.rating.satisfied' },
  { value: 5, emoji: '🤩', labelKey: 'feature.profile.learnings.rating.very_satisfied' },
];

const STATUS_TABS: LearningStatus[] = ['upcoming', 'current', 'completed'];

/**
 * My Learnings tab — Upcoming / Current / Completed sub-tabs over the learner's
 * active enrolments, partitioned by cohort start date and completion. The
 * Current view exposes progress + the course-rating widget and feeds the
 * active course to the right rail. Figma 851-43960 / 951-48857 / 851-45445.
 */
@Component({
  selector: 'app-my-learnings-tab',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe, BadgeComponent, ShimmerComponent, EmptyStateComponent],
  templateUrl: './my-learnings-tab.component.html',
  styleUrl: './my-learnings-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyLearningsTabComponent implements OnChanges {
  @Input({ required: true }) set courses(value: LearningCourse[]) {
    this._courses.set(value ?? []);
  }
  @Input() set completedCourses(value: CompletedCourse[]) {
    this._completed.set(value ?? []);
  }
  @Input() loading = false;
  @Input() set search(value: string) {
    this._search.set(value ?? '');
  }
  @Output() activeCourseChange = new EventEmitter<LearningCourse | null>();

  private readonly service = inject(ProfileService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  private readonly _courses = signal<LearningCourse[]>([]);
  private readonly _completed = signal<CompletedCourse[]>([]);
  private readonly _search = signal('');
  protected readonly status = signal<LearningStatus>('current');

  protected readonly tabs = STATUS_TABS;
  protected readonly faces = RATING_FACES;
  protected readonly skeletons = Array.from({ length: 3 });
  protected readonly playerBase = `/${LmsRoutes.MyLearnings}`;
  protected readonly catalogueBase = `/${LmsRoutes.Catalogue}`;

  protected readonly draftRating = signal<number | null>(null);
  protected readonly draftComment = signal('');
  protected readonly submitting = signal(false);

  private readonly today = new Date();

  private readonly searched = computed(() => {
    const term = this._search();
    const list = this._courses();
    return term ? list.filter((c) => c.title.toLowerCase().includes(term)) : list;
  });

  protected readonly upcoming = computed(() => this.searched().filter((c) => this.isUpcoming(c)));
  protected readonly current = computed(() =>
    this.searched().filter((c) => !this.isUpcoming(c) && c.progress.percent < 100),
  );

  /** Completed courses come from a dedicated endpoint (the active list omits them). */
  protected readonly completed = computed(() => {
    const term = this._search();
    const list = this._completed();
    return term ? list.filter((c) => c.title.toLowerCase().includes(term)) : list;
  });

  /** Upcoming/Current rows share the LearningCourse shape; Completed is rendered separately. */
  protected readonly visible = computed(() =>
    this.status() === 'upcoming' ? this.upcoming() : this.current(),
  );

  constructor() {
    // The right rail (attendance / active session) mirrors whichever course
    // heads the Current list.
    effect(() => {
      const first = this.status() === 'current' ? this.current()[0] ?? null : null;
      this.activeCourseChange.emit(first);
    });
  }

  ngOnChanges(): void {
    // reset rating draft when inputs change
    this.draftRating.set(null);
    this.draftComment.set('');
  }

  protected setStatus(status: LearningStatus): void {
    this.status.set(status);
  }

  protected startsInDays(course: LearningCourse): number | null {
    if (!course.cohort?.start_date) {
      return null;
    }
    const start = new Date(course.cohort.start_date).getTime();
    const diff = Math.ceil((start - this.today.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  }

  protected get emptyState(): EmptyStateConfig {
    return {
      icon: 'pi-book',
      title: this.translate.instant(`feature.profile.learnings.empty.${this.status()}`),
      message: this.translate.instant('feature.profile.learnings.empty.message'),
    };
  }

  protected pickRating(value: number): void {
    this.draftRating.set(value);
  }

  protected submitRating(course: LearningCourse): void {
    const rating = this.draftRating();
    if (rating === null || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.service.submitRating(course.id, rating, this.draftComment().trim() || null).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notify.success(this.translate.instant('feature.profile.learnings.rating.thanks'));
        this.draftRating.set(null);
        this.draftComment.set('');
      },
      error: () => this.submitting.set(false),
    });
  }

  private isUpcoming(course: LearningCourse): boolean {
    if (!course.cohort?.start_date) {
      return false;
    }
    return new Date(course.cohort.start_date).getTime() > this.today.getTime();
  }
}
