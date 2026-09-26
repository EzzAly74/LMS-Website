import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { NotificationService } from '../../../../core/services/notification.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { EmptyStateComponent, EmptyStateConfig } from '../../../../shared/components/empty-state/empty-state.component';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { CourseDetailComponent } from '../../../my-learnings/components/course-detail/course-detail.component';
import { CertificateStatus, CompletedCourse, LearningCourse, LearningStatus } from '../../models/profile.models';
import { ProfileService } from '../../services/profile.service';
import { ExternalTrainingService } from '../../services/external-training.service';

const STATUS_TABS: LearningStatus[] = ['upcoming', 'current', 'completed'];

/**
 * My Learnings tab — Upcoming / Current / Completed sub-tabs over the learner's
 * active enrolments, partitioned by cohort start date and completion. The
 * Current list is cards (certificate badge + View Details); opening a card
 * swaps in the in-profile Course Detail (rating/modules/attendance live there,
 * NOT in the list). Figma 1047-63328 / 851-44908 / 951-48857 / 851-45445.
 */
@Component({
  selector: 'app-my-learnings-tab',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    BadgeComponent,
    ShimmerComponent,
    EmptyStateComponent,
    CourseDetailComponent,
  ],
  templateUrl: './my-learnings-tab.component.html',
  styleUrl: './my-learnings-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyLearningsTabComponent {
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

  private readonly translate = inject(TranslateService);
  private readonly profile = inject(ProfileService);
  private readonly notify = inject(NotificationService);
  private readonly externalTraining = inject(ExternalTrainingService);

  /** Certificate id currently downloading (disables its button). */
  protected readonly downloadingId = signal<number | null>(null);
  /** External training request whose certificate is downloading. */
  protected readonly downloadingExternal = signal<number | null>(null);

  private readonly _courses = signal<LearningCourse[]>([]);
  private readonly _completed = signal<CompletedCourse[]>([]);
  private readonly _search = signal('');
  protected readonly status = signal<LearningStatus>('current');

  protected readonly tabs = STATUS_TABS;
  protected readonly skeletons = Array.from({ length: 3 });
  protected readonly catalogueBase = `/${LmsRoutes.Catalogue}`;

  /** In-profile master-detail: the Current course opened via "View Details". */
  protected readonly selectedCourse = signal<LearningCourse | null>(null);

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
    // The right rail (attendance / active session) mirrors the opened course,
    // else whichever course heads the Current list.
    effect(() => {
      const selected = this.selectedCourse();
      if (selected) {
        this.activeCourseChange.emit(selected);
        return;
      }
      const first = this.status() === 'current' ? this.current()[0] ?? null : null;
      this.activeCourseChange.emit(first);
    });
  }

  protected setStatus(status: LearningStatus): void {
    this.selectedCourse.set(null);
    this.status.set(status);
  }

  /** Open the in-profile Course Detail for a Current card (Figma 851-44908). */
  protected openDetail(course: LearningCourse): void {
    this.selectedCourse.set(course);
  }

  protected closeDetail(): void {
    this.selectedCourse.set(null);
  }

  /** Download an earned certificate via the authenticated blob endpoint
   * (a raw <a href> can't attach the bearer token / API base URL). */
  protected downloadCertificate(course: CompletedCourse): void {
    if (course.certificate_id === null || this.downloadingId() !== null) {
      return;
    }
    this.downloadingId.set(course.certificate_id);
    this.profile.downloadCertificate(course.certificate_id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${course.certificate_id}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.downloadingId.set(null);
      },
      error: () => {
        this.downloadingId.set(null);
        this.notify.error(this.translate.instant('feature.my_learnings.download_failed'));
      },
    });
  }

  /** A course and an external training can share an id, and external rows have no course_id. */
  protected completedKey(c: CompletedCourse): string {
    return c.kind === 'external' ? `external-${c.external_id}` : `course-${c.course_id}`;
  }

  /** The learner's own uploaded certificate for an approved external training. */
  protected downloadExternalCertificate(course: CompletedCourse): void {
    const id = course.external_id;
    if (id === undefined || this.downloadingExternal() !== null) {
      return;
    }
    this.downloadingExternal.set(id);
    this.externalTraining.certificate(id).subscribe({
      next: (blob) => {
        const ext = blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : 'jpg';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `external-training-${id}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.downloadingExternal.set(null);
      },
      error: () => {
        this.downloadingExternal.set(null);
        this.notify.error(this.translate.instant('feature.my_learnings.download_failed'));
      },
    });
  }

  /** i18n key for the "Certificate: …" badge on a Current card (Figma frame 6). */
  protected certLabelKey(status: CertificateStatus): string | null {
    switch (status) {
      case 'earned':
        return 'feature.profile.learnings.certificate.earned';
      case 'on_track':
        return 'feature.profile.learnings.certificate.on_track';
      case 'at_risk':
        return 'feature.profile.learnings.certificate.at_risk';
      case 'blocked':
        return 'feature.profile.learnings.certificate.blocked';
      default:
        return null;
    }
  }

  /** Map the projection status onto the shared badge's tone/status. */
  protected certBadgeStatus(status: CertificateStatus): 'earned' | 'on_track' | 'at_risk' {
    if (status === 'earned') {
      return 'earned';
    }
    if (status === 'on_track') {
      return 'on_track';
    }
    return 'at_risk';
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

  private isUpcoming(course: LearningCourse): boolean {
    if (!course.cohort?.start_date) {
      return false;
    }
    return new Date(course.cohort.start_date).getTime() > this.today.getTime();
  }
}
