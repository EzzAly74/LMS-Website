import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { RatingStarsComponent } from '../../../../shared/components/rating-stars/rating-stars.component';
import { CatalogueCourse } from '../../models/catalogue.models';

/**
 * Course card for the catalogue grid. Lives in the catalogue feature for now;
 * promote to shared (with a neutral view-model) once My Learnings reuses it.
 *
 * The CTA defaults to `course.cta.state` (server-resolved enrolment state —
 * Enrol Now / Enrolment Closed - Notify me / Enrolled). `ctaLabelOverride`
 * lets a future feature (e.g. My Learnings, with Continue/Resume/Review CTAs
 * unrelated to catalogue enrolment) reuse this same card without that logic.
 */
@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe, AvatarComponent, BadgeComponent, RatingStarsComponent],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCardComponent {
  @Input({ required: true }) course!: CatalogueCourse;
  @Input() ctaLabelOverride?: string;
  @Output() enrol = new EventEmitter<CatalogueCourse>();
  @Output() notifyMe = new EventEmitter<CatalogueCourse>();

  protected readonly detailRoute = `/${LmsRoutes.Catalogue}`;

  protected get instructor() {
    return this.course.instructors?.[0] ?? null;
  }

  protected get deliveryKey(): string {
    return `feature.catalogue.delivery.${this.course.course_type}`;
  }

  protected get levelKey(): string | null {
    return this.course.level ? `feature.catalogue.level.${this.course.level}` : null;
  }

  protected get ctaLabelKey(): string {
    if (this.ctaLabelOverride) {
      return this.ctaLabelOverride;
    }
    switch (this.course.cta.state) {
      case 'enrol_now':
        return 'feature.catalogue.actions.enrol';
      case 'get_notified':
        return 'feature.catalogue.actions.notify_me';
      case 'enrolled_view_learning':
        return 'feature.catalogue.actions.enrolled';
      default:
        return 'feature.catalogue.actions.unavailable';
    }
  }

  protected get isActionable(): boolean {
    return this.course.cta.state === 'enrol_now' || this.course.cta.state === 'get_notified';
  }

  protected onCtaClick(): void {
    if (this.course.cta.state === 'get_notified') {
      this.notifyMe.emit(this.course);
    } else if (this.course.cta.state === 'enrol_now') {
      this.enrol.emit(this.course);
    }
  }
}
