import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * "Enrolment Failed" login prompt shown when a guest tries to enrol from the
 * public catalogue or a course page (Figma 1801:65085) — a centered modal on
 * the web and a bottom sheet on mobile. Presentational only: it emits
 * `login` / `cancel` and the host decides where to route.
 */
@Component({
  selector: 'app-login-required-dialog',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './login-required-dialog.component.html',
  styleUrl: './login-required-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginRequiredDialogComponent {
  @Output() login = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cancel.emit();
  }
}
