import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { RatingStarsComponent } from '../../../../shared/components/rating-stars/rating-stars.component';
import { CatalogueCourse } from '../../models/catalogue.models';

/**
 * Course card for the catalogue grid. Lives in the catalogue feature for now;
 * promote to shared (with a neutral view-model) once My Learnings reuses it.
 */
@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [DatePipe, TranslatePipe, AvatarComponent, BadgeComponent, RatingStarsComponent],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCardComponent {
  @Input({ required: true }) course!: CatalogueCourse;
  @Input() ctaLabel = '';
  @Output() enrol = new EventEmitter<CatalogueCourse>();

  protected get instructor() {
    return this.course.instructors?.[0] ?? null;
  }

  protected get deliveryKey(): string {
    return `feature.catalogue.delivery.${this.course.course_type}`;
  }

  protected onEnrol(): void {
    this.enrol.emit(this.course);
  }
}
