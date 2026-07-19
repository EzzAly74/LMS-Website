import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { CourseUnit } from '../../models/course-detail.models';

/**
 * Curriculum tab: numbered module/unit list. Module content is only visible
 * after enrolment (names + session metadata only), per the design and the
 * business rule that course content isn't shown pre-enrolment.
 */
@Component({
  selector: 'app-curriculum-tab',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './curriculum-tab.component.html',
  styleUrl: './curriculum-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurriculumTabComponent {
  private readonly unitsInput = signal<CourseUnit[]>([]);
  @Input({ required: true }) set units(value: CourseUnit[]) {
    this.unitsInput.set(value ?? []);
  }
  @Input() durationWeeks: number | null = null;

  protected readonly totalUnits = computed(() => this.unitsInput().length);
  protected readonly totalSessions = computed(
    () => new Set(this.unitsInput().map((u) => u.session_id).filter((id) => id !== null)).size,
  );

  protected get orderedUnits(): CourseUnit[] {
    return this.unitsInput();
  }
}
