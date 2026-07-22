import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Minimal course shape the enrolment dialog renders. Both the catalogue's
 * {@link CatalogueCourse} and the course-detail model are assignable to it, so
 * either page can open the dialog without coupling to a specific course type.
 */
export interface EnrolmentDialogCourse {
  title: string;
  image: string | null;
  next_cohort: { start_date: string } | null;
}

/**
 * "Request Enrolment" confirmation shown before a learner is enrolled — a
 * centered modal on the web (Figma 1787:91433) and a bottom sheet on mobile
 * (Figma 963:51293). Presentational only: it emits confirm/cancel and the
 * host page owns the enrolment request.
 */
@Component({
  selector: 'app-enrolment-dialog',
  standalone: true,
  imports: [DatePipe, TranslatePipe],
  templateUrl: './enrolment-dialog.component.html',
  styleUrl: './enrolment-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrolmentDialogComponent {
  @Input({ required: true }) course!: EnrolmentDialogCourse;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cancel.emit();
  }
}
