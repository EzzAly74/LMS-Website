import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { CohortSession, CourseUnit } from '../../models/course-detail.models';
import { PluralKeyPipe } from '../../../../shared/pipes/plural-key.pipe';

/** One session row of the Curriculum tab, with the modules it covers. */
interface CurriculumSession {
  id: number;
  /** 1-based position in the cohort's schedule, shown as "Session N". */
  number: number;
  contents: { id: number; title: string }[];
}

/**
 * Curriculum tab (Figma 807:40170): the course's module count, the anchor
 * cohort's session count and the course length, then one row per session
 * of that cohort. A row expands to the modules the session covers, as set in
 * the cohort's schedule sheet ("content" column, D-079).
 */
@Component({
  selector: 'app-curriculum-tab',
  standalone: true,
  imports: [PluralKeyPipe, TranslatePipe],
  templateUrl: './curriculum-tab.component.html',
  styleUrl: './curriculum-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurriculumTabComponent {
  private readonly unitsInput = signal<CourseUnit[]>([]);
  private readonly sessionsInput = signal<CohortSession[]>([]);

  @Input({ required: true }) set units(value: CourseUnit[]) {
    this.unitsInput.set(value ?? []);
  }
  /** The anchor cohort's sessions; empty when no cohort is scheduled. */
  @Input({ required: true }) set sessions(value: CohortSession[]) {
    this.sessionsInput.set(value ?? []);
  }
  @Input() durationWeeks: number | null = null;

  protected readonly totalUnits = computed(() => this.unitsInput().length);

  protected readonly rows = computed<CurriculumSession[]>(() => {
    const titles = new Map(this.unitsInput().map((u) => [u.id, u.title]));
    // Labelled by position in the request language: the stored session title
    // is single-language (I18N-05) and is "Session N" anyway.
    return this.sessionsInput().map((s, i) => ({
      id: s.id,
      number: i + 1,
      contents: (s.content_ids ?? [])
        .filter((id) => titles.has(id))
        .map((id) => ({ id, title: titles.get(id) as string })),
    }));
  });

  /** Ids of the sessions currently expanded. */
  protected readonly open = signal<ReadonlySet<number>>(new Set());

  protected toggle(id: number): void {
    const next = new Set(this.open());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.open.set(next);
  }
}
