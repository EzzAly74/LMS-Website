import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Generic skeleton-loading placeholder bar. Compose several into a
 * page-shaped skeleton (see course-detail-skeleton, course-player-skeleton,
 * notification-skeleton) instead of showing a plain "Loading…" string —
 * used for both the initial fetch and any locale-triggered refetch.
 */
@Component({
  selector: 'app-shimmer',
  standalone: true,
  template: '',
  styleUrl: './shimmer.component.scss',
  host: {
    class: 'shimmer',
    '[style.width]': 'width',
    '[style.height]': 'height',
    '[style.border-radius]': 'radius',
    'aria-hidden': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShimmerComponent {
  @Input() width = '100%';
  @Input() height = '12px';
  @Input() radius = 'var(--radius-control-xs)';
}
