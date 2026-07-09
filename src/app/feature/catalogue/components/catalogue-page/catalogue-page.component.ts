import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { NotificationService } from '../../../../core/services/notification.service';
import { CardSkeletonComponent } from '../../../../shared/components/card-skeleton/card-skeleton.component';
import {
  EmptyStateComponent,
  EmptyStateConfig,
} from '../../../../shared/components/empty-state/empty-state.component';
import { LoadMoreComponent } from '../../../../shared/components/load-more/load-more.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import {
  ToggleOption,
  ToggleTabsComponent,
} from '../../../../shared/components/toggle-tabs/toggle-tabs.component';
import { CatalogueCourse, ScopeChip } from '../../models/catalogue.models';
import { CatalogueService } from '../../services/catalogue.service';
import { CourseCardComponent } from '../course-card/course-card.component';

const PER_PAGE = 12;

@Component({
  selector: 'app-catalogue-page',
  standalone: true,
  imports: [
    TranslatePipe,
    CourseCardComponent,
    SearchInputComponent,
    ToggleTabsComponent,
    CardSkeletonComponent,
    EmptyStateComponent,
    LoadMoreComponent,
  ],
  templateUrl: './catalogue-page.component.html',
  styleUrl: './catalogue-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CataloguePageComponent implements OnInit {
  private readonly catalogue = inject(CatalogueService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  protected readonly courses = signal<CatalogueCourse[]>([]);
  protected readonly scopes = signal<ScopeChip[]>([]);
  protected readonly selectedScope = signal('all');
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly totalRecords = signal(0);

  private searchTerm = '';
  private page = 1;

  protected readonly hasMore = computed(() => this.courses().length < this.totalRecords());
  protected readonly skeletons = Array.from({ length: 8 });

  protected readonly scopeOptions = computed<ToggleOption[]>(() =>
    this.scopes().map((s) => ({ value: s.key, label: s.label, count: s.count })),
  );

  ngOnInit(): void {
    this.loadScopes();
    this.loadCourses(true);
  }

  protected onSearch(term: string): void {
    this.searchTerm = term;
    this.loadCourses(true);
  }

  protected onScopeChange(scope: string): void {
    this.selectedScope.set(scope);
    this.loadCourses(true);
  }

  protected onLoadMore(): void {
    this.page += 1;
    this.loadingMore.set(true);
    this.loadCourses(false);
  }

  protected onEnrol(course: CatalogueCourse): void {
    this.catalogue.enrol(course.id, course.next_cohort?.id).subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result?.is_success) {
          this.notify.success(this.translate.instant('feature.catalogue.enrol.success'));
          this.loadScopes();
          this.loadCourses(true);
        }
      },
    });
  }

  protected get emptyState(): EmptyStateConfig {
    return {
      icon: 'pi-compass',
      title: this.translate.instant('feature.catalogue.empty.title'),
      message: this.translate.instant('feature.catalogue.empty.message'),
    };
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

    this.catalogue
      .getCourses({
        scope: this.selectedScope(),
        search: this.searchTerm || null,
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
        },
        error: () => {
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }
}
