import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { CourseDetailInstructor, CourseDetailRating } from '../../models/course-detail.models';

/** Instructor tab: profile card + bio. */
@Component({
  selector: 'app-instructor-tab',
  standalone: true,
  imports: [TranslatePipe, AvatarComponent],
  templateUrl: './instructor-tab.component.html',
  styleUrl: './instructor-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorTabComponent {
  @Input({ required: true }) instructor!: CourseDetailInstructor;
  @Input() rating: CourseDetailRating | null = null;
}
