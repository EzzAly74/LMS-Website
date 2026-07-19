import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';

/** Skeleton matching the course-player sidebar-outline + lesson-content shape. */
@Component({
  selector: 'app-course-player-skeleton',
  standalone: true,
  imports: [ShimmerComponent],
  templateUrl: './course-player-skeleton.component.html',
  styleUrl: './course-player-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursePlayerSkeletonComponent {
  protected readonly rows = Array.from({ length: 5 });
}
