import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';
import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { reloadOnLanguageChange } from '../../../../core/utils/reload-on-language-change';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { TranslatePipe } from '@ngx-translate/core';
import {
  CompletedCourse,
  LearningCourse,
  ProfileCounts,
  ProfileSummary,
  ProfileTab,
  QualificationProgress,
} from '../../models/profile.models';
import { ProfileService } from '../../services/profile.service';
import { MyLearningsTabComponent } from '../my-learnings-tab/my-learnings-tab.component';
import { ProfileSidebarComponent } from '../profile-sidebar/profile-sidebar.component';
import { QualificationsTabComponent } from '../qualifications-tab/qualifications-tab.component';

interface StatCounter {
  key: keyof ProfileCounts;
  labelKey: string;
}

const STAT_COUNTERS: StatCounter[] = [
  { key: 'required', labelKey: 'feature.profile.stats.required' },
  { key: 'earned', labelKey: 'feature.profile.stats.earned' },
  { key: 'in_progress', labelKey: 'feature.profile.stats.in_progress' },
  { key: 'not_started', labelKey: 'feature.profile.stats.not_started' },
];

/**
 * Learner Profile dashboard shell — header (identity + counters), tab switch
 * (Qualifications / My Learnings), and the right rail. Owns the three payloads
 * (summary, qualifications, active learnings) and hands them to child tabs.
 */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    TranslatePipe,
    AvatarComponent,
    ShimmerComponent,
    QualificationsTabComponent,
    MyLearningsTabComponent,
    ProfileSidebarComponent,
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  private readonly service = inject(ProfileService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly summary = signal<ProfileSummary | null>(null);
  protected readonly qualifications = signal<QualificationProgress[]>([]);
  protected readonly learnings = signal<LearningCourse[]>([]);
  protected readonly completed = signal<CompletedCourse[]>([]);
  protected readonly loading = signal(true);
  protected readonly activeTab = signal<ProfileTab>('qualifications');
  protected readonly searchTerm = signal('');

  protected readonly counters = STAT_COUNTERS;

  protected readonly counterValues = computed<ProfileCounts>(
    () => this.summary()?.counts ?? { required: 0, earned: 0, in_progress: 0, not_started: 0 },
  );

  /** The course currently open in the "Current" sub-tab feeds the sidebar. */
  protected readonly activeCourse = signal<LearningCourse | null>(null);

  constructor() {
    reloadOnLanguageChange(() => this.load());
  }

  ngOnInit(): void {
    this.load();
  }

  protected setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
  }

  protected onSearch(value: string): void {
    this.searchTerm.set(value.trim().toLowerCase());
  }

  protected onActiveCourseChange(course: LearningCourse | null): void {
    this.activeCourse.set(course);
  }

  protected logout(): void {
    // Profile is an auth-only route, so leave it as the session ends —
    // guards don't re-run reactively, so the redirect must be explicit.
    const leave = () => this.router.navigateByUrl(`/${LmsRoutes.Catalogue}`);
    this.auth.logout().subscribe({ next: leave, error: leave });
  }

  private load(): void {
    this.loading.set(true);
    this.service.getSummary().subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) {
          this.summary.set(res.result);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.service.getQualifications().subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) {
          this.qualifications.set(res.result);
        }
      },
    });

    this.service.getLearnings().subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) {
          this.learnings.set(res.result);
        }
      },
    });

    this.service.getCompleted().subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) {
          this.completed.set(res.result);
        }
      },
    });
  }
}
