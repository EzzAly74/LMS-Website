import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../../core/auth/auth.service';
import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { NotificationService } from '../../../../core/services/notification.service';
import { reloadOnLanguageChange } from '../../../../core/utils/reload-on-language-change';
import { CardSkeletonComponent } from '../../../../shared/components/card-skeleton/card-skeleton.component';
import {
  EmptyStateComponent,
  EmptyStateConfig,
} from '../../../../shared/components/empty-state/empty-state.component';
import { FilterSidebarComponent } from '../../../../shared/components/filter-sidebar/filter-sidebar.component';
import { FilterSection, FilterSelection, FilterSidebarConfig } from '../../../../shared/components/filter-sidebar/filter-sidebar.model';
import { LoadMoreComponent } from '../../../../shared/components/load-more/load-more.component';
import { LoginRequiredDialogComponent } from '../../../../shared/components/login-required-dialog/login-required-dialog.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import {
  ToggleOption,
  ToggleTabsComponent,
} from '../../../../shared/components/toggle-tabs/toggle-tabs.component';
import {
  CatalogueCourse,
  CatalogueFilterMeta,
  CourseLevel,
  DeliveryType,
  DurationBucket,
  ScopeChip,
  SortOption,
} from '../../models/catalogue.models';
import { CatalogueService } from '../../services/catalogue.service';
import { CourseCardComponent } from '../course-card/course-card.component';
import { EnrolmentDialogComponent } from '../enrolment-dialog/enrolment-dialog.component';

const PER_PAGE = 12;
const TYPE_VALUES: DeliveryType[] = ['online', 'offline', 'hybrid'];
const LEVEL_VALUES: CourseLevel[] = ['beginner', 'intermediate', 'professional'];
const DURATION_VALUES: DurationBucket[] = ['1_2_weeks', '2_4_weeks', '4_8_weeks', '8_plus_weeks'];
const SORT_VALUES: SortOption[] = ['most_relevant', 'highest_rated', 'soonest_start', 'newest'];

@Component({
  selector: 'app-catalogue-page',
  standalone: true,
  imports: [
    TranslatePipe,
    CourseCardComponent,
    SearchInputComponent,
    ToggleTabsComponent,
    FilterSidebarComponent,
    CardSkeletonComponent,
    EmptyStateComponent,
    LoadMoreComponent,
    EnrolmentDialogComponent,
    LoginRequiredDialogComponent,
  ],
  templateUrl: './catalogue-page.component.html',
  styleUrl: './catalogue-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CataloguePageComponent implements OnInit {
  private readonly catalogue = inject(CatalogueService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly courses = signal<CatalogueCourse[]>([]);
  protected readonly scopes = signal<ScopeChip[]>([]);
  protected readonly selectedScope = signal('all');
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly totalRecords = signal(0);
  protected readonly jobRoles = signal<{ id: number; name: string }[]>([]);
  protected readonly filters = signal<FilterSelection>({
    type: [],
    level: [],
    duration: [],
    job_role: [],
    sort: [SORT_VALUES[0]],
  });

  /** Course awaiting enrolment confirmation — drives the enrolment dialog. */
  protected readonly enrolCandidate = signal<CatalogueCourse | null>(null);
  /** Whether the guest "please sign in" prompt is open. */
  protected readonly loginPromptOpen = signal(false);

  protected searchTerm = '';
  private page = 1;
  /** Tracks auth transitions so login/logout refreshes the catalogue in place. */
  private lastAuthState: boolean | null = null;

  protected readonly hasMore = computed(() => this.courses().length < this.totalRecords());
  protected readonly skeletons = Array.from({ length: 8 });

  protected readonly scopeOptions = computed<ToggleOption[]>(() =>
    this.scopes().map((s) => ({ value: s.key, label: s.label, count: s.count })),
  );

  private readonly filterMeta = signal<CatalogueFilterMeta | undefined>(undefined);

  protected readonly filterConfig = computed<FilterSidebarConfig>(() =>
    this.buildFilterConfig(this.filterMeta(), this.jobRoles()),
  );

  constructor() {
    // Backend course/filter text is localized via Accept-Language — refetch
    // instead of leaving stale-language content on screen after a switch.
    reloadOnLanguageChange(() => {
      this.loadJobRoles();
      this.loadScopes();
      this.loadCourses(true);
    });

    // Login/logout while sitting on the catalogue must refresh it in place:
    // scope tabs + job-role filter appear/disappear and the course set changes
    // between the guest (public) view and the personalised learner view.
    effect(() => {
      const authed = this.auth.isAuthenticated();
      if (this.lastAuthState === null) {
        this.lastAuthState = authed;
        return; // initial run — ngOnInit already did the first load
      }
      if (authed === this.lastAuthState) {
        return;
      }
      this.lastAuthState = authed;
      if (!authed) {
        this.selectedScope.set('all'); // guests have no scope tabs
      }
      this.page = 1;
      this.loadJobRoles();
      this.loadScopes();
      this.loadCourses(true);
    });
  }

  ngOnInit(): void {
    this.seedFromQueryParams();
    this.loadJobRoles();
    this.loadScopes();
    this.loadCourses(true);
  }

  protected onSearch(term: string): void {
    this.searchTerm = term;
    this.syncQueryParams();
    this.loadCourses(true);
  }

  protected onScopeChange(scope: string): void {
    this.selectedScope.set(scope);
    this.syncQueryParams();
    this.loadCourses(true);
  }

  protected onFilterChange(next: FilterSelection): void {
    this.filters.set(next);
    this.syncQueryParams();
    this.loadCourses(true);
  }

  protected onClearAllFilters(): void {
    this.filters.set({ type: [], level: [], duration: [], job_role: [], sort: [SORT_VALUES[0]] });
    this.syncQueryParams();
    this.loadCourses(true);
  }

  protected onLoadMore(): void {
    this.page += 1;
    this.loadingMore.set(true);
    this.loadCourses(false);
  }

  /**
   * Enrol CTA opens the "Request Enrolment" confirmation dialog — but a guest
   * (browsing the public catalogue) is sent to login first, since enrolment
   * requires an authenticated learner.
   */
  protected onEnrol(course: CatalogueCourse): void {
    if (!this.auth.isAuthenticated()) {
      this.loginPromptOpen.set(true);
      return;
    }
    this.enrolCandidate.set(course);
  }

  protected onLoginPromptCancel(): void {
    this.loginPromptOpen.set(false);
  }

  /** Guest confirmed the prompt — go to login, returning to the catalogue. */
  protected onLoginPromptConfirm(): void {
    this.loginPromptOpen.set(false);
    this.router.navigate(['/' + LmsRoutes.Login], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  protected onEnrolCancel(): void {
    this.enrolCandidate.set(null);
  }

  /** Dialog confirmed — send the enrolment request for the pending course. */
  protected onEnrolConfirm(): void {
    const course = this.enrolCandidate();
    if (!course) {
      return;
    }
    this.enrolCandidate.set(null);
    this.catalogue.enrol(course.id, course.next_cohort?.id).subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result?.is_success) {
          this.notify.success(
            this.translate.instant('feature.catalogue.enrol.success'),
            this.translate.instant('feature.catalogue.enrol.success_title'),
          );
          this.loadScopes();
          this.loadCourses(true);
        } else {
          this.showEnrolError();
        }
      },
      error: () => this.showEnrolError(),
    });
  }

  protected onNotifyMe(course: CatalogueCourse): void {
    if (!this.auth.isAuthenticated()) {
      this.loginPromptOpen.set(true);
      return;
    }
    this.catalogue.notifyMe(course.id).subscribe({
      next: () => this.notify.success(this.translate.instant('feature.catalogue.notify.success')),
      error: () => this.showEnrolError(),
    });
  }

  protected get emptyState(): EmptyStateConfig {
    return {
      icon: 'pi-compass',
      title: this.translate.instant('feature.catalogue.empty.title'),
      message: this.translate.instant('feature.catalogue.empty.message'),
    };
  }

  private showEnrolError(): void {
    this.notify.error(
      this.translate.instant('common.error_generic'),
      this.translate.instant('feature.catalogue.enrol.error_title'),
    );
  }

  private loadJobRoles(): void {
    // The Job Role filter is authenticated-only; don't fetch it for guests.
    if (!this.auth.isAuthenticated()) {
      this.jobRoles.set([]);
      return;
    }
    this.catalogue.getJobRoles().subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) {
          this.jobRoles.set(res.result);
        }
      },
    });
  }

  private loadScopes(): void {
    this.catalogue.getScopes().subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) {
          this.scopes.set(res.result);
        }
      },
    });
  }

  private loadCourses(reset: boolean): void {
    if (reset) {
      this.page = 1;
      this.loading.set(true);
    }

    const f = this.filters();
    this.catalogue
      .getCourses({
        scope: this.selectedScope(),
        search: this.searchTerm || null,
        type: (f['type'] ?? []) as DeliveryType[],
        level: (f['level'] ?? []) as CourseLevel[],
        duration: (f['duration'] ?? []) as DurationBucket[],
        job_role_id: (f['job_role'] ?? []).map(Number),
        sort: (f['sort']?.[0] ?? SORT_VALUES[0]) as SortOption,
        page: this.page,
        per_page: PER_PAGE,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.loadingMore.set(false);
          if (res.status !== 'success' || !res.result) {
            return;
          }
          this.courses.set(reset ? res.result : [...this.courses(), ...res.result]);
          this.totalRecords.set(res.meta?.total ?? res.result.length);
          this.filterMeta.set(res.meta?.filters);
        },
        error: () => {
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }

  private buildFilterConfig(meta: CatalogueFilterMeta | undefined, jobRoles: { id: number; name: string }[]): FilterSidebarConfig {
    const countFor = (bucket: Record<string, number> | undefined, value: string): number | undefined =>
      bucket?.[value];

    const sections: FilterSection[] = [
      {
        key: 'type',
        icon: 'pi-th-large',
        label: this.translate.instant('feature.catalogue.filters.type'),
        type: 'checkbox',
        expanded: true,
        options: TYPE_VALUES.map((v) => ({
          value: v,
          label: this.translate.instant(`feature.catalogue.delivery.${v}`),
          count: countFor(meta?.type, v),
        })),
      },
      {
        key: 'level',
        icon: 'pi-chart-bar',
        label: this.translate.instant('feature.catalogue.filters.level'),
        type: 'checkbox',
        expanded: false,
        options: LEVEL_VALUES.map((v) => ({
          value: v,
          label: this.translate.instant(`feature.catalogue.level.${v}`),
          count: countFor(meta?.level, v),
        })),
      },
      {
        key: 'duration',
        icon: 'pi-clock',
        label: this.translate.instant('feature.catalogue.filters.duration'),
        type: 'checkbox',
        expanded: false,
        options: DURATION_VALUES.map((v) => ({
          value: v,
          label: this.translate.instant(`feature.catalogue.filters.duration_options.${v}`),
          count: countFor(meta?.duration, v),
        })),
      },
      // Job Role is a learner-facing filter — hidden for guests (who only see
      // public, no-qualification courses that no job role maps to anyway).
      ...(this.auth.isAuthenticated()
        ? [
            {
              key: 'job_role',
              icon: 'pi-briefcase',
              label: this.translate.instant('feature.catalogue.filters.job_role'),
              type: 'chip' as const,
              expanded: false,
              options: jobRoles.map((jr) => ({ value: String(jr.id), label: jr.name })),
            },
          ]
        : []),
      {
        key: 'sort',
        icon: 'pi-sort-alt',
        label: this.translate.instant('feature.catalogue.filters.sort_by'),
        type: 'radio',
        expanded: false,
        options: SORT_VALUES.map((v) => ({
          value: v,
          label: this.translate.instant(`feature.catalogue.filters.sort_options.${v}`),
        })),
      },
    ];

    return { sections };
  }

  private seedFromQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    this.searchTerm = params.get('search') ?? '';
    this.selectedScope.set(params.get('scope') ?? 'all');
    this.filters.set({
      type: params.get('type')?.split(',').filter(Boolean) ?? [],
      level: params.get('level')?.split(',').filter(Boolean) ?? [],
      duration: params.get('duration')?.split(',').filter(Boolean) ?? [],
      job_role: params.get('job_role')?.split(',').filter(Boolean) ?? [],
      sort: [params.get('sort') ?? SORT_VALUES[0]],
    });
  }

  private syncQueryParams(): void {
    const f = this.filters();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.searchTerm || null,
        scope: this.selectedScope() === 'all' ? null : this.selectedScope(),
        type: f['type']?.length ? f['type'].join(',') : null,
        level: f['level']?.length ? f['level'].join(',') : null,
        duration: f['duration']?.length ? f['duration'].join(',') : null,
        job_role: f['job_role']?.length ? f['job_role'].join(',') : null,
        sort: f['sort']?.[0] && f['sort'][0] !== SORT_VALUES[0] ? f['sort'][0] : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
