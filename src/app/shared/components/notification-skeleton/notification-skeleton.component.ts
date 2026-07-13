import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ShimmerComponent } from '../shimmer/shimmer.component';

/** Skeleton row matching notification-list-item's shape. */
@Component({
  selector: 'app-notification-skeleton',
  standalone: true,
  imports: [ShimmerComponent],
  template: `
    <div class="notif-skeleton">
      <app-shimmer width="36px" height="36px" radius="var(--radius-pill)" />
      <div class="notif-skeleton__body">
        <app-shimmer width="60%" height="14px" />
        <app-shimmer width="90%" height="12px" />
        <app-shimmer width="70px" height="10px" />
      </div>
    </div>
  `,
  styleUrl: './notification-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationSkeletonComponent {}
