import { Injectable, effect, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { MessagesService } from '../../feature/messages/services/messages.service';
import { AuthService } from '../auth/auth.service';
import { EchoService } from './echo.service';

/** Payload shape of the `message.sent` broadcast — see App\Events\MessageSent. */
export interface MessageSentPayload {
  id: number;
  conversation_id: number;
  body: string;
  sender_type: 'User' | 'Instructor' | 'Admin';
  sender_id: number;
  sender_name: string;
  created_at: string | null;
  last_message_at: string | null;
}

/**
 * The learner's own Messages realtime feed — the FAB badge count plus a
 * push stream the widget reacts to, replacing the previous 30s poll.
 * Scoped to the learner's own `identity.User.{id}` channel (see
 * routes/channels.php); a same-email instructor/admin sibling account
 * (cross-entity convention) is picked up on the next normal fetch, not
 * pushed live — the learner website only ever authenticates as a User.
 */
@Injectable({ providedIn: 'root' })
export class MessagesRealtimeService {
  private readonly service = inject(MessagesService);
  private readonly auth = inject(AuthService);
  private readonly echo = inject(EchoService);

  readonly unreadCount = signal(0);

  /** Emits every `message.sent` push not authored by the current learner. */
  readonly messageReceived$ = new Subject<MessageSentPayload>();

  private subscribedChannel: string | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.user();
      this.unsubscribe();

      if (!user) return;

      this.refreshUnread();

      const name = `identity.User.${user.id}`;
      this.subscribedChannel = name;
      this.echo.channel(name)?.listen('.message.sent', (payload: MessageSentPayload) => {
        if (payload.sender_type === 'User' && payload.sender_id === user.id) return;
        this.unreadCount.update((c) => c + 1);
        this.messageReceived$.next(payload);
      });
    });
  }

  refreshUnread(): void {
    this.service.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res.status === 'success' && res.result ? res.result.count : 0),
    });
  }

  private unsubscribe(): void {
    if (this.subscribedChannel) this.echo.leave(this.subscribedChannel);
    this.subscribedChannel = null;
  }
}
