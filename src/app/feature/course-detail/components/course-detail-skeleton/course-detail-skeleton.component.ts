import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';

/** Skeleton matching the course-detail hero + enrolment-card + tabs shape. */
@Component({
  selector: 'app-course-detail-skeleton',
  standalone: true,
  imports: [ShimmerComponent],
  templateUrl: './course-detail-skeleton.component.html',
  styleUrl: './course-detail-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailSkeletonComponent {}
