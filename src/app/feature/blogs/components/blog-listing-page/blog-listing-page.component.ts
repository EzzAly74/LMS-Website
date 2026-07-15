import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../../core/auth/auth.service';
import { reloadOnLanguageChange } from '../../../../core/utils/reload-on-language-change';
import { CardSkeletonComponent } from '../../../../shared/components/card-skeleton/card-skeleton.component';
import { EmptyStateComponent, EmptyStateConfig } from '../../../../shared/components/empty-state/empty-state.component';
import { FilterSidebarComponent } from '../../../../shared/components/filter-sidebar/filter-sidebar.component';
import { FilterSection, FilterSelection, FilterSidebarConfig } from '../../../../shared/components/filter-sidebar/filter-sidebar.model';
import { LoadMoreComponent } from '../../../../shared/components/load-more/load-more.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { ToggleOption, ToggleTabsComponent } from '../../../../shared/components/toggle-tabs/toggle-tabs.component';
import { BlogCardComponent } from '../blog-card/blog-card.component';
import { BlogHeroComponent } from '../blog-hero/blog-hero.component';
import { BlogLevel, BlogListItem, BlogScope, BlogTopic } from '../../models/blog.models';
import { BlogsService } from '../../services/blogs.service';

const PER_PAGE = 9;
const LEVEL_VALUES: BlogLevel[] = ['beginner', 'intermediate', 'professional'];

@Component({
  selector: 'app-blog-listing-page',
  standalone: true,
  imports: [
    TranslatePipe,
    SearchInputComponent,
    ToggleTabsComponent,
    FilterSidebarComponent,
    CardSkeletonComponent,
    EmptyStateComponent,
    LoadMoreComponent,
    BlogCardComponent,
    BlogHeroComponent,
  ],
  templateUrl: './blog-listing-page.component.html',
  styleUrl: './blog-listing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogListingPageComponent implements OnInit {
  private readonly blogsApi = inject(BlogsService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly blogs = signal<BlogListItem[]>([]);
  protected readonly topics = signal<BlogTopic[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly totalRecords = signal(0);
  protected readonly selectedScope = signal<BlogScope>('all');
  protected readonly filters = signal<FilterSelection>({ topic: [], level: [] });

  protected searchTerm = '';
  private page = 1;

  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly heroBlog = computed<BlogListItem | null>(() => this.blogs()[0] ?? null);
  protected readonly gridBlogs = computed<BlogListItem[]>(() => this.blogs().slice(1));
  protected readonly hasMore = computed(() => this.blogs().length < this.totalRecords());
  protected readonly skeletons = Array.from({ length: 6 });

  protected readonly scopeOptions = computed<ToggleOption[]>(() => [
    { value: 'tailored', label: this.translate.instant('feature.blogs.scope.tailored') },
    { value: 'all', label: this.translate.instant('feature.blogs.scope.all') },
  ]);

  protected readonly filterConfig = computed<FilterSidebarConfig>(() => this.buildFilterConfig(this.topics()));

  constructor() {
    reloadOnLanguageChange(() => {
      this.loadTopics();
      this.loadBlogs(true);
    });
  }

  ngOnInit(): void {
    this.seedFromQueryParams();
    this.loadTopics();
    this.loadBlogs(true);
  }

  protected onSearch(term: string): void {
    this.searchTerm = term;
    this.syncQueryParams();
    this.loadBlogs(true);
  }

  protected onScopeChange(scope: string): void {
    this.selectedScope.set(scope as BlogScope);
    this.syncQueryParams();
    this.loadBlogs(true);
  }

  protected onFilterChange(next: FilterSelection): void {
    this.filters.set(next);
    this.syncQueryParams();
    this.loadBlogs(true);
  }

  protected onClearAllFilters(): void {
    this.filters.set({ topic: [], level: [] });
    this.syncQueryParams();
    this.loadBlogs(true);
  }

  protected onLoadMore(): void {
    this.page += 1;
    this.loadingMore.set(true);
    this.loadBlogs(false);
  }

  protected get emptyState(): EmptyStateConfig {
    return {
      icon: 'pi-book',
      title: this.translate.instant('feature.blogs.empty.title'),
      message: this.translate.instant('feature.blogs.empty.message'),
    };
  }

  /** Tailored requires a signed-in learner; guests always see "Explore All". */
  private effectiveScope(): BlogScope {
    return this.isAuthenticated() ? this.selectedScope() : 'all';
  }

  private loadTopics(): void {
    this.blogsApi.getTopics().subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) this.topics.set(res.result);
      },
    });
  }

  private loadBlogs(reset: boolean): void {
    if (reset) {
      this.page = 1;
      this.loading.set(true);
    }

    const f = this.filters();
    this.blogsApi
      .getBlogs(
        {
          search: this.searchTerm || null,
          level: (f['level'] ?? []) as BlogLevel[],
          qualification_ids: (f['topic'] ?? []).map(Number),
          page: this.page,
          per_page: PER_PAGE,
        },
        this.effectiveScope(),
      )
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.loadingMore.set(false);
          if (res.status !== 'success' || !res.result) return;
          this.blogs.set(reset ? res.result : [...this.blogs(), ...res.result]);
          this.totalRecords.set(res.meta?.total ?? res.result.length);
        },
        error: () => {
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }

  private buildFilterConfig(topics: BlogTopic[]): FilterSidebarConfig {
    const sections: FilterSection[] = [
      {
        key: 'topic',
        icon: 'pi-tag',
        label: this.translate.instant('feature.blogs.filters.topic'),
        type: 'chip',
        expanded: true,
        options: topics.map((t) => ({ value: String(t.id), label: t.name })),
      },
      {
        key: 'level',
        icon: 'pi-chart-bar',
        label: this.translate.instant('feature.blogs.filters.level'),
        type: 'checkbox',
        expanded: true,
        options: LEVEL_VALUES.map((v) => ({
          value: v,
          label: this.translate.instant(`feature.blogs.level.${v}`),
        })),
      },
    ];
    return { sections };
  }

  private seedFromQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    this.searchTerm = params.get('search') ?? '';
    this.selectedScope.set((params.get('scope') as BlogScope) ?? 'all');
    this.filters.set({
      topic: params.get('topic')?.split(',').filter(Boolean) ?? [],
      level: params.get('level')?.split(',').filter(Boolean) ?? [],
    });
  }

  private syncQueryParams(): void {
    const f = this.filters();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.searchTerm || null,
        scope: this.selectedScope() === 'all' ? null : this.selectedScope(),
        topic: f['topic']?.length ? f['topic'].join(',') : null,
        level: f['level']?.length ? f['level'].join(',') : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
