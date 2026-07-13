import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LmsRoutes } from '../../../core/enums/lms-routes.enum';
import { NotificationItem } from '../../../core/models/notification.model';
import { NotificationInboxService } from '../../../core/services/notification-inbox.service';
import { EmptyStateComponent, EmptyStateConfig } from '../empty-state/empty-state.component';
import { NotificationListItemComponent } from '../notification-list-item/notification-list-item.component';
import { NotificationSkeletonComponent } from '../notification-skeleton/notification-skeleton.component';

/** Dropdown panel opened by {@link NotificationBellComponent}. */
@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [TranslatePipe, RouterLink, NotificationListItemComponent, NotificationSkeletonComponent, EmptyStateComponent],
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationPanelComponent implements OnInit {
  protected readonly inbox = inject(NotificationInboxService);
  protected readonly routes = LmsRoutes;
  protected readonly skeletons = Array.from({ length: 4 });
  private readonly translate = inject(TranslateService);

  @Output() closed = new EventEmitter<void>();

  ngOnInit(): void {
    this.inbox.loadFirstPage();
  }

  protected get emptyState(): EmptyStateConfig {
    return {
      icon: 'pi-bell',
      title: this.translate.instant('core.notifications.empty.title'),
      message: this.translate.instant('core.notifications.empty.message'),
    };
  }

  protected onActivate(item: NotificationItem): void {
    this.inbox.markRead(item.id);
  }

  protected onMarkAllRead(): void {
    this.inbox.markAllRead();
  }

  protected onViewAll(): void {
    this.closed.emit();
  }
}
