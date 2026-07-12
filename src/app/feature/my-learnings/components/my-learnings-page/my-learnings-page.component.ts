import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { CardSkeletonComponent } from '../../../../shared/components/card-skeleton/card-skeleton.component';
import { EmptyStateComponent, EmptyStateConfig } from '../../../../shared/components/empty-state/empty-state.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { ActiveCourse } from '../../models/my-learnings.models';
import { MyLearningsService } from '../../services/my-learnings.service';

@Component({
  selector: 'app-my-learnings-page',
  standalone: true,
  imports: [DatePipe, TranslatePipe, RouterLink, BadgeComponent, CardSkeletonComponent, EmptyStateComponent, SearchInputComponent],
  templateUrl: './my-learnings-page.component.html',
  styleUrl: './my-learnings-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyLearningsPageComponent implements OnInit {
  private readonly service = inject(MyLearningsService);
  private readonly translate = inject(TranslateService);

  private readonly allCourses = signal<ActiveCourse[]>([]);
  protected readonly loading = signal(true);
  protected readonly skeletons = Array.from({ length: 4 });
  private readonly searchTerm = signal('');

  /** GET my/learnings returns the learner's whole (unpaginated) course list — filter client-side. */
  protected readonly courses = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.allCourses();
    }
    return this.allCourses().filter((c) => c.title.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.loadCourses();
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  protected deliveryKey(course: ActiveCourse): string {
    return `feature.my_learnings.delivery.${course.delivery_type}`;
  }

  protected playerRoute(course: ActiveCourse): string[] {
    return [`/${LmsRoutes.MyLearnings}`, String(course.id), 'learn'];
  }

  protected get emptyState(): EmptyStateConfig {
    return {
      icon: 'pi-book',
      title: this.translate.instant('feature.my_learnings.empty.title'),
      message: this.translate.instant('feature.my_learnings.empty.message'),
    };
  }

  private loadCourses(): void {
    this.loading.set(true);
    this.service.getActiveCourses().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.status === 'success' && res.result) {
          this.allCourses.set(res.result);
        }
      },
      error: () => this.loading.set(false),
    });
  }
}
