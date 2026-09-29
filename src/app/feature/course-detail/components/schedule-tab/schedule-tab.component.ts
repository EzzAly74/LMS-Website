import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LanguageService } from '../../../../core/services/language.service';
import { CohortSession } from '../../models/course-detail.models';

/**
 * Schedule tab (Figma 2027:97810): the anchor cohort's sessions, a table on
 * wide containers and one card per session on narrow ones. Status and
 * duration come from the API (server clock).
 */
@Component({
  selector: 'app-schedule-tab',
  standalone: true,
  imports: [DatePipe, TranslatePipe],
  templateUrl: './schedule-tab.component.html',
  styleUrl: './schedule-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleTabComponent {
  @Input({ required: true }) sessions: CohortSession[] = [];

  protected readonly lang = inject(LanguageService).current;

  /** "09:00:00" → "09:00". */
  protected time(value: string | null): string {
    return value ? value.slice(0, 5) : '—';
  }

  /** i18n key + params for "2h 30m" / "2h" / "45m". */
  protected duration(minutes: number | null): { key: string; params: Record<string, number> } | null {
    if (!minutes) {
      return null;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h && m) {
      return { key: 'feature.course_detail.schedule.duration_hm', params: { h, m } };
    }
    return h
      ? { key: 'feature.course_detail.schedule.duration_h', params: { h } }
      : { key: 'feature.course_detail.schedule.duration_m', params: { m } };
  }
}
