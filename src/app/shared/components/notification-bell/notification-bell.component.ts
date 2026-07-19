import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { NotificationInboxService } from '../../../core/services/notification-inbox.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';

/** Header bell with unread-count badge; opens {@link NotificationPanelComponent}. */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [TranslatePipe, ClickOutsideDirective, NotificationPanelComponent],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  protected readonly inbox = inject(NotificationInboxService);
  protected readonly isOpen = signal(false);

  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }

  protected close(): void {
    this.isOpen.set(false);
  }
}
