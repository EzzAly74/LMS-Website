import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { NotificationItem } from '../models/notification.model';
import { PaginationMeta } from '../models/api-response.model';
import { reloadOnLanguageChange } from '../utils/reload-on-language-change';
import { ApiService } from './api.service';

const PAGE_SIZE = 10;

/**
 * Learner activity-notification inbox (bell/panel/page) — distinct from
 * {@link import('./notification.service').NotificationService}, which only
 * handles app-wide toast messages. Backed by /api/v1/notifications/mine/*,
 * which is shared by the header bell (core) and the full notifications page
 * (feature/notifications), mirroring how AuthService backs both the header
 * and the login page.
 */
@Injectable({ providedIn: 'root' })
export class NotificationInboxService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly base = 'notifications/mine';

  private readonly _unreadCount = signal(0);
  private readonly _items = signal<NotificationItem[]>([]);
  private readonly _meta = signal<PaginationMeta | null>(null);
  private readonly _loading = signal(false);
  private readonly _loadingMore = signal(false);

  readonly unreadCount = this._unreadCount.asReadonly();
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly hasMore = computed(() => {
    const meta = this._meta();
    return !!meta && meta.current_page < meta.last_page;
  });

  constructor() {
    effect(
      () => {
        if (this.auth.isAuthenticated()) {
          this.refreshUnreadCount();
        } else {
          this.reset();
        }
      },
      // `reset()` writes signals synchronously (on logout) — safe here since
      // none of them feed back into `auth.isAuthenticated()`.
      { allowSignalWrites: true },
    );

    // Notification title/body are localized via Accept-Language — refetch
    // whatever's already loaded instead of leaving stale-language text in
    // the bell panel / full notifications page after a switch.
    reloadOnLanguageChange(() => {
      if (this._items().length > 0) {
        this.loadFirstPage();
      }
    });
  }

  refreshUnreadCount(): void {
    this.api.get<{ count: number }>(`${this.base}/unread-count`).subscribe((res) => {
      if (res.status === 'success' && res.result) {
        this._unreadCount.set(res.result.count);
      }
    });
  }

  loadFirstPage(): void {
    this._loading.set(true);
    this.api
      .get<NotificationItem[]>(this.base, { params: { page: 1, per_page: PAGE_SIZE } })
      .subscribe({
        next: (res) => {
          this._items.set(res.result ?? []);
          this._meta.set(res.meta ?? null);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  loadMore(): void {
    const meta = this._meta();
    if (!meta || meta.current_page >= meta.last_page || this._loadingMore()) {
      return;
    }
    this._loadingMore.set(true);
    this.api
      .get<NotificationItem[]>(this.base, {
        params: { page: meta.current_page + 1, per_page: PAGE_SIZE },
      })
      .subscribe({
        next: (res) => {
          this._items.update((items) => [...items, ...(res.result ?? [])]);
          this._meta.set(res.meta ?? null);
          this._loadingMore.set(false);
        },
        error: () => this._loadingMore.set(false),
      });
  }

  markRead(id: string): void {
    const target = this._items().find((item) => item.id === id);
    if (!target || target.read_at) {
      return;
    }
    const readAt = new Date().toISOString();
    this._items.update((items) => items.map((item) => (item.id === id ? { ...item, read_at: readAt } : item)));
    this._unreadCount.update((count) => Math.max(0, count - 1));
    this.api.post(`${this.base}/${id}/read`).subscribe({
      error: () => {
        this._items.update((items) => items.map((item) => (item.id === id ? { ...item, read_at: null } : item)));
        this._unreadCount.update((count) => count + 1);
      },
    });
  }

  markAllRead(): void {
    if (this._unreadCount() === 0) {
      return;
    }
    const readAt = new Date().toISOString();
    const previousItems = this._items();
    const previousCount = this._unreadCount();
    this._items.set(previousItems.map((item) => ({ ...item, read_at: item.read_at ?? readAt })));
    this._unreadCount.set(0);
    this.api.post(`${this.base}/read-all`).subscribe({
      error: () => {
        this._items.set(previousItems);
        this._unreadCount.set(previousCount);
      },
    });
  }

  private reset(): void {
    this._unreadCount.set(0);
    this._items.set([]);
    this._meta.set(null);
  }
}
