import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { LearningCourse, ProfileTab, SessionAttendance } from '../../models/profile.models';
import { ProfileService } from '../../services/profile.service';

/**
 * Profile right rail. Shows the learner's next/live "Active Session" (derived
 * from the embedded live_session data on active courses) and, while a Current
 * course is open, its "My Attendance" breakdown + certificate-at-risk warning
 * (real per-session attendance from /courses/{id}/sessions). Figma right rail.
 */
@Component({
  selector: 'app-profile-sidebar',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe],
  templateUrl: './profile-sidebar.component.html',
  styleUrl: './profile-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSidebarComponent {
  @Input() set courses(value: LearningCourse[]) {
    this._courses.set(value ?? []);
  }
  @Input() set activeCourse(value: LearningCourse | null) {
    this._activeCourse.set(value);
    this.loadSessions(value);
  }
  @Input() set tab(value: ProfileTab) {
    this._tab.set(value);
  }

  private readonly service = inject(ProfileService);

  private readonly _courses = signal<LearningCourse[]>([]);
  private readonly _activeCourse = signal<LearningCourse | null>(null);
  private readonly _tab = signal<ProfileTab>('qualifications');
  protected readonly sessions = signal<SessionAttendance[]>([]);
  protected readonly sessionsLoading = signal(false);

  protected readonly playerBase = `/${LmsRoutes.MyLearnings}`;

  /** The course whose live/soonest session drives the Active Session card. */
  protected readonly activeSessionCourse = computed(() => {
    const courses = this._courses();
    return courses.find((c) => c.isLive && c.live_session) ?? courses.find((c) => c.live_session) ?? null;
  });

  protected readonly attendanceCourse = computed(() =>
    this._tab() === 'my_learnings' ? this._activeCourse() : null,
  );

  /** Show a neutral placeholder when there's neither a live session nor an
   * open attendance course, so the rail is never blank (matches Figma). */
  protected readonly showPlaceholder = computed(
    () => !this.activeSessionCourse() && !this.attendanceCourse(),
  );

  protected readonly attended = computed(() => this.sessions().filter((s) => s.attended).length);

  protected readonly atRisk = computed(() => {
    const course = this.attendanceCourse();
    return !!course && course.progress.absences > 0;
  });

  private loadSessions(course: LearningCourse | null): void {
    if (!course) {
      this.sessions.set([]);
      return;
    }
    this.sessionsLoading.set(true);
    this.service.getSessions(course.id).subscribe({
      next: (res) => {
        this.sessions.set(res.status === 'success' && res.result ? res.result : []);
        this.sessionsLoading.set(false);
      },
      error: () => this.sessionsLoading.set(false),
    });
  }
}
