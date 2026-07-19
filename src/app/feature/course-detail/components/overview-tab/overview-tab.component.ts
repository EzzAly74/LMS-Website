import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { CourseDetailQualification } from '../../models/course-detail.models';

/** Overview tab: what you'll learn, requirements, qualifications earned. */
@Component({
  selector: 'app-overview-tab',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './overview-tab.component.html',
  styleUrl: './overview-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewTabComponent {
  @Input({ required: true }) whatYouWillLearn: string[] = [];
  @Input({ required: true }) requirements: string[] = [];
  @Input({ required: true }) qualifications: CourseDetailQualification[] = [];
}
