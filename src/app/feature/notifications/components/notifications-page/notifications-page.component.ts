import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { NotificationItem } from '../../../../core/models/notification.model';
import { NotificationInboxService } from '../../../../core/services/notification-inbox.service';
import { EmptyStateComponent, EmptyStateConfig } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadMoreComponent } from '../../../../shared/components/load-more/load-more.component';
import { NotificationListItemComponent } from '../../../../shared/components/notification-list-item/notification-list-item.component';
import { NotificationSkeletonComponent } from '../../../../shared/components/notification-skeleton/notification-skeleton.component';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [TranslatePipe, NotificationListItemComponent, NotificationSkeletonComponent, EmptyStateComponent, LoadMoreComponent],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent implements OnInit {
  protected readonly inbox = inject(NotificationInboxService);
  protected readonly skeletons = Array.from({ length: 6 });
  private readonly translate = inject(TranslateService);

  ngOnInit(): void {
    this.inbox.loadFirstPage();
  }

  protected onActivate(item: NotificationItem): void {
    this.inbox.markRead(item.id);
  }

  protected onMarkAllRead(): void {
    this.inbox.markAllRead();
  }

  protected onLoadMore(): void {
    this.inbox.loadMore();
  }

  protected get emptyState(): EmptyStateConfig {
    return {
      icon: 'pi-bell',
      title: this.translate.instant('core.notifications.empty.title'),
      message: this.translate.instant('core.notifications.empty.message'),
    };
  }
}
