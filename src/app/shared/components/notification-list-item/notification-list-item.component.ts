import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';

import { NotificationItem, NotificationType } from '../../../core/models/notification.model';
import { LanguageService } from '../../../core/services/language.service';
import { RelativeDatePipe } from '../../pipes/relative-date.pipe';

const TYPE_ICONS: Record<string, string> = {
  pending_grade: 'pi-hourglass',
  rating_dropped: 'pi-chart-line',
  assignment_completed: 'pi-verified',
  course_assigned: 'pi-briefcase',
  cohort_created: 'pi-calendar-plus',
  broadcast: 'pi-megaphone',
};
const DEFAULT_ICON = 'pi-bell';

/** One row in the notification bell panel / full notifications page. */
@Component({
  selector: 'app-notification-list-item',
  standalone: true,
  imports: [RelativeDatePipe],
  template: `
    <button type="button" class="notif-item" [class.notif-item--unread]="!item.read_at" (click)="activate.emit(item)">
      <span class="notif-item__icon"><i class="pi {{ icon }}" aria-hidden="true"></i></span>
      <span class="notif-item__body">
        <span class="notif-item__title">{{ item.title }}</span>
        <span class="notif-item__text" [innerHTML]="item.body"></span>
        <span class="notif-item__time">{{ item.created_at | relativeDate: language.current() }}</span>
      </span>
      @if (!item.read_at) {
        <span class="notif-item__dot" aria-hidden="true"></span>
      }
    </button>
  `,
  styleUrl: './notification-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationListItemComponent {
  protected readonly language = inject(LanguageService);

  @Input({ required: true }) item!: NotificationItem;
  @Output() activate = new EventEmitter<NotificationItem>();

  protected get icon(): string {
    return TYPE_ICONS[this.item.type as NotificationType] ?? DEFAULT_ICON;
  }
}
