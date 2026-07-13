import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { LanguageService } from '../../../../core/services/language.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { reloadOnLanguageChange } from '../../../../core/utils/reload-on-language-change';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { EmptyStateComponent, EmptyStateConfig } from '../../../../shared/components/empty-state/empty-state.component';
import { RatingStarsComponent } from '../../../../shared/components/rating-stars/rating-stars.component';
import { CourseDetail, CourseDetailTab } from '../../models/course-detail.models';
import { CourseDetailService } from '../../services/course-detail.service';
import { CourseDetailSkeletonComponent } from '../course-detail-skeleton/course-detail-skeleton.component';
import { CurriculumTabComponent } from '../curriculum-tab/curriculum-tab.component';
import { InstructorTabComponent } from '../instructor-tab/instructor-tab.component';
import { OverviewTabComponent } from '../overview-tab/overview-tab.component';

@Component({
  selector: 'app-course-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    RouterLink,
    BadgeComponent,
    RatingStarsComponent,
    EmptyStateComponent,
    CourseDetailSkeletonComponent,
    OverviewTabComponent,
    CurriculumTabComponent,
    InstructorTabComponent,
  ],
  templateUrl: './course-detail-page.component.html',
  styleUrl: './course-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CourseDetailService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  protected readonly catalogueRoute = `/${LmsRoutes.Catalogue}`;
  protected readonly course = signal<CourseDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly activeTab = signal<CourseDetailTab>('overview');

  protected readonly instructor = computed(() => this.course()?.instructors?.[0] ?? null);

  protected readonly whatYouWillLearn = computed(
    () => this.course()?.what_students_will_learn?.[this.language.current()] ?? [],
  );
  protected readonly requirements = computed(
    () => this.course()?.requirements?.[this.language.current()] ?? [],
  );

  protected readonly includesList = computed(() => {
    const c = this.course();
    if (!c) {
      return [];
    }
    const sessionCount = c.anchor_cohort?.sessions.length ?? 0;
    const items: { key: string; params?: Record<string, unknown> }[] = [];
    if (sessionCount > 0) {
      items.push({ key: 'feature.course_detail.includes.sessions', params: { count: sessionCount } });
    }
    if (c.units.some((u) => /pdf|article|document/i.test(u.content_type))) {
      items.push({ key: 'feature.course_detail.includes.reading' });
    }
    if (c.units.some((u) => /quiz|assignment/i.test(u.content_type))) {
      items.push({ key: 'feature.course_detail.includes.assessments' });
    }
    if (c.has_certificate) {
      items.push({ key: 'feature.course_detail.includes.certificate' });
    }
    return items;
  });

  protected readonly seatsLeft = computed(() => this.course()?.anchor_cohort?.seats_left ?? null);

  protected readonly seatsPercent = computed(() => {
    const cohort = this.course()?.anchor_cohort;
    if (!cohort?.capacity) {
      return 0;
    }
    return Math.min(100, Math.round((cohort.enrolled_count / cohort.capacity) * 100));
  });

  protected readonly isActionable = computed(() => {
    const state = this.course()?.cta.state;
    return state === 'enrol_now' || state === 'get_notified';
  });

  protected readonly ctaLabelKey = computed(() => {
    switch (this.course()?.cta.state) {
      case 'enrol_now':
        return 'feature.catalogue.actions.enrol';
      case 'get_notified':
        return 'feature.catalogue.actions.notify_me';
      case 'enrolled_view_learning':
        return 'feature.catalogue.actions.enrolled';
      default:
        return 'feature.catalogue.actions.unavailable';
    }
  });

  constructor() {
    // Backend course text is localized via Accept-Language — refetch instead
    // of leaving stale-language content on screen after a switch.
    reloadOnLanguageChange(() => this.loadCourse());
  }

  ngOnInit(): void {
    this.loadCourse();
  }

  /**
   * `showSkeleton` is false for the post-enrol silent refresh (only the CTA/
   * enrolment state actually changed — replacing the whole page with a
   * skeleton there would just be jarring), and true for the initial load and
   * the locale-triggered reload, where the content itself is changing language.
   */
  private loadCourse(showSkeleton = true): void {
    if (showSkeleton) {
      this.loading.set(true);
    }
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getCourse(id).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.status === 'success' && res.result) {
          this.course.set(res.result);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  protected setTab(tab: CourseDetailTab): void {
    this.activeTab.set(tab);
  }

  protected get notFoundState(): EmptyStateConfig {
    return {
      icon: 'pi-exclamation-circle',
      title: this.translate.instant('feature.course_detail.not_found.title'),
      message: this.translate.instant('feature.course_detail.not_found.message'),
    };
  }

  protected onCta(): void {
    const c = this.course();
    if (!c) {
      return;
    }
    if (c.cta.state === 'get_notified') {
      this.service.notifyMe(c.id).subscribe({
        next: () => this.notify.success(this.translate.instant('feature.catalogue.notify.success')),
        error: () => this.showError(),
      });
    } else if (c.cta.state === 'enrol_now') {
      this.service.enrol(c.id, c.anchor_cohort?.id).subscribe({
        next: (res) => {
          if (res.status === 'success' && res.result?.is_success) {
            this.notify.success(
              this.translate.instant('feature.catalogue.enrol.success'),
              this.translate.instant('feature.catalogue.enrol.success_title'),
            );
            this.loadCourse(false);
          } else {
            this.showError();
          }
        },
        error: () => this.showError(),
      });
    }
  }

  private showError(): void {
    this.notify.error(
      this.translate.instant('common.error_generic'),
      this.translate.instant('feature.catalogue.enrol.error_title'),
    );
  }
}
