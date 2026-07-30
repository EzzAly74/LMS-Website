import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { interval } from 'rxjs';

import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside.directive';
import { Conversation, ConversationThread, MessageRecipient, MessageTab, RecipientGroup } from '../../models/messages.models';
import { MessagesService } from '../../services/messages.service';

const TABS: MessageTab[] = ['all', 'instructors', 'admins'];

/**
 * Floating Messages widget (Figma frames 841-42746 / 841-43294): an envelope
 * FAB with an unread badge that opens a popover with the conversation list
 * (All / Instructors / Admins) and a thread view + composer. Unread count is
 * polled so the badge stays fresh.
 */
@Component({
  selector: 'app-messages-widget',
  standalone: true,
  imports: [DatePipe, TranslatePipe, AvatarComponent, ClickOutsideDirective],
  templateUrl: './messages-widget.component.html',
  styleUrl: './messages-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesWidgetComponent implements OnInit {
  private readonly service = inject(MessagesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tabs = TABS;
  protected readonly open = signal(false);
  protected readonly tab = signal<MessageTab>('all');
  protected readonly conversations = signal<Conversation[]>([]);
  protected readonly loadingList = signal(false);
  protected readonly thread = signal<ConversationThread | null>(null);
  protected readonly loadingThread = signal(false);
  protected readonly unread = signal(0);
  protected readonly draft = signal('');
  protected readonly sending = signal(false);

  // Compose (start a new conversation)
  protected readonly composing = signal(false);
  protected readonly recipients = signal<MessageRecipient[]>([]);
  protected readonly selectedRecipient = signal<MessageRecipient | null>(null);

  /** Recipients sectioned by role for the compose picker (Instructors / Admins). */
  protected readonly recipientGroups = computed<RecipientGroup[]>(() => {
    const order: RecipientGroup['role'][] = ['instructors', 'admins', 'learners'];
    const labels: Record<RecipientGroup['role'], string> = {
      instructors: 'feature.messages.group.instructors',
      admins: 'feature.messages.group.admins',
      learners: 'feature.messages.group.learners',
    };
    return order
      .map((role) => ({ role, labelKey: labels[role], items: this.recipients().filter((r) => r.role === role) }))
      .filter((g) => g.items.length > 0);
  });

  /** Currently-open conversation id (highlights its list row). */
  protected readonly activeId = computed(() => this.thread()?.conversation.id ?? null);
  /** True when the right pane is showing a thread or the compose flow. */
  protected readonly detailOpen = computed(() => this.thread() !== null || this.composing());

  ngOnInit(): void {
    this.refreshUnread();
    // Poll the unread badge every 30s while the app is open.
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshUnread());
  }

  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.thread.set(null);
      this.composing.set(false);
      this.selectedRecipient.set(null);
      this.loadConversations();
    }
  }

  protected close(): void {
    this.open.set(false);
  }

  protected setTab(tab: MessageTab): void {
    this.tab.set(tab);
    this.loadConversations();
  }

  protected openConversation(conversation: Conversation): void {
    this.loadingThread.set(true);
    this.thread.set(null);
    this.service.getThread(conversation.id).subscribe({
      next: (res) => {
        this.thread.set(res.status === 'success' && res.result ? res.result : null);
        this.loadingThread.set(false);
        this.refreshUnread();
      },
      error: () => this.loadingThread.set(false),
    });
  }

  protected back(): void {
    this.thread.set(null);
    this.composing.set(false);
    this.selectedRecipient.set(null);
    this.draft.set('');
    this.loadConversations();
  }

  protected openCompose(): void {
    this.thread.set(null);
    this.selectedRecipient.set(null);
    this.draft.set('');
    this.composing.set(true);
    this.service.getRecipients().subscribe({
      next: (res) => this.recipients.set(res.status === 'success' && res.result ? res.result : []),
    });
  }

  protected pickRecipient(recipient: MessageRecipient): void {
    this.selectedRecipient.set(recipient);
    this.draft.set('');
  }

  protected startConversation(): void {
    const recipient = this.selectedRecipient();
    const body = this.draft().trim();
    if (!recipient || !body || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.service.start(recipient, body).subscribe({
      next: (res) => {
        this.sending.set(false);
        this.composing.set(false);
        this.selectedRecipient.set(null);
        this.draft.set('');
        if (res.status === 'success' && res.result) {
          this.openConversation({ id: res.result.conversation_id } as Conversation);
        }
      },
      error: () => this.sending.set(false),
    });
  }

  protected send(): void {
    const current = this.thread();
    const body = this.draft().trim();
    if (!current || !body || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.service.reply(current.conversation.id, body).subscribe({
      next: (res) => {
        this.sending.set(false);
        if (res.status === 'success' && res.result) {
          this.thread.set(res.result);
          this.draft.set('');
        }
      },
      error: () => this.sending.set(false),
    });
  }

  private loadConversations(): void {
    this.loadingList.set(true);
    this.service.getConversations(this.tab()).subscribe({
      next: (res) => {
        // Be tolerant of either a plain array or a serialized paginator
        // ({ data: [...] }) so the @for never receives a non-iterable.
        const result = res.result as unknown;
        const list = Array.isArray(result)
          ? (result as Conversation[])
          : ((result as { data?: Conversation[] })?.data ?? []);
        this.conversations.set(res.status === 'success' ? list : []);
        this.loadingList.set(false);
      },
      error: () => this.loadingList.set(false),
    });
  }

  private refreshUnread(): void {
    this.service.getUnreadCount().subscribe({
      next: (res) => this.unread.set(res.status === 'success' && res.result ? res.result.count : 0),
    });
  }
}
