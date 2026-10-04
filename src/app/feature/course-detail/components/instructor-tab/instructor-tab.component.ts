import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { isCourseLevel } from '../../../catalogue/models/catalogue.models';
import { CourseDetailInstructor } from '../../models/course-detail.models';
import { PluralKeyPipe } from '../../../../shared/pipes/plural-key.pipe';

/**
 * Instructor tab (Figma 818:40243, phone 966:50318): profile card with title
 * and the instructor's rating, learners and courses; bio; other courses
 * (NEW2B-5926).
 */
@Component({
  selector: 'app-instructor-tab',
  standalone: true,
  imports: [PluralKeyPipe, TranslatePipe, AvatarComponent, RouterLink, DecimalPipe],
  templateUrl: './instructor-tab.component.html',
  styleUrl: './instructor-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorTabComponent {
  @Input({ required: true }) instructor!: CourseDetailInstructor;

  /** `catalogue/:id` without the parameter. */
  protected readonly detailRoute = '/' + LmsRoutes.CourseDetail.replace('/:id', '');

  protected readonly knownLevel = isCourseLevel;

  /** The first name, for "Other courses by Sara". */
  protected get firstName(): string {
    return this.instructor.name.trim().split(/\s+/)[0] ?? this.instructor.name;
  }
}
