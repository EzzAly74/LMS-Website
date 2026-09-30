import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { LmsRoutes } from '../../enums/lms-routes.enum';
import { NotificationService } from '../../services/notification.service';

/**
 * Global site footer, built pixel-perfect from Figma node 1005:52620 (desktop)
 * and 1003:52441 (mobile) — dark brand panel, nav links, newsletter capture,
 * legal links, and copyright.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly notify = inject(NotificationService);

  protected readonly routes = LmsRoutes;
  protected readonly year = new Date().getFullYear();
  protected readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });

  protected subscribe(): void {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }
    this.notify.success('core.footer.newsletter.success');
    this.email.reset('');
  }
}
