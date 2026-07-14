import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { EmptyStateComponent, EmptyStateConfig } from '../../../../shared/components/empty-state/empty-state.component';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { QualificationProgress } from '../../models/profile.models';

/**
 * Qualifications tab — one expandable card per required qualification, each
 * split into earned (with certificate download) and uncovered (no-cohort /
 * notify-me) course rows. Pixel-perfect from Figma 832-41307 / 841-42290.
 */
@Component({
  selector: 'app-qualifications-tab',
  standalone: true,
  imports: [DatePipe, TranslatePipe, ShimmerComponent, EmptyStateComponent],
  templateUrl: './qualifications-tab.component.html',
  styleUrl: './qualifications-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualificationsTabComponent {
  @Input({ required: true }) set qualifications(value: QualificationProgress[]) {
    this._qualifications.set(value ?? []);
  }
  @Input() loading = false;
  @Input() set search(value: string) {
    this._search.set(value ?? '');
  }

  private readonly _qualifications = signal<QualificationProgress[]>([]);
  private readonly _search = signal('');
  private readonly expanded = signal<Set<number>>(new Set());

  protected readonly skeletons = Array.from({ length: 4 });

  protected readonly filtered = computed(() => {
    const term = this._search();
    const list = this._qualifications();
    if (!term) {
      return list;
    }
    return list.filter(
      (q) =>
        q.name.toLowerCase().includes(term) ||
        q.earned_courses.some((c) => c.title.toLowerCase().includes(term)) ||
        q.uncovered_courses.some((c) => c.title.toLowerCase().includes(term)),
    );
  });

  protected readonly emptyState: EmptyStateConfig = {
    icon: 'pi-verified',
    title: 'feature.profile.qualifications.empty.title',
    message: 'feature.profile.qualifications.empty.message',
  };

  protected isExpanded(id: number): boolean {
    return this.expanded().has(id);
  }

  protected toggle(id: number): void {
    const next = new Set(this.expanded());
    next.has(id) ? next.delete(id) : next.add(id);
    this.expanded.set(next);
  }
}
