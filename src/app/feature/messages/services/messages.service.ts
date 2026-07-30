import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { Conversation, ConversationThread, MessageRecipient, MessageTab } from '../models/messages.models';

/** Learner-web two-way Messages API (/api/v1/learner/profile/messages). */
@Injectable({ providedIn: 'root' })
export class MessagesService {
  private readonly api = inject(ApiService);
  // Unified conversation store — the SAME endpoints the dashboard inbox uses.
  private readonly base = 'conversations';

  getConversations(tab: MessageTab): Observable<ApiResponse<Conversation[]>> {
    const query = tab === 'all' ? '' : `?role=${tab}`;
    return this.api.get<Conversation[]>(`${this.base}${query}`);
  }

  getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
    return this.api.get<{ count: number }>(`${this.base}/unread-count`);
  }

  getThread(conversationId: number): Observable<ApiResponse<ConversationThread>> {
    return this.api.get<ConversationThread>(`${this.base}/${conversationId}`);
  }

  reply(conversationId: number, body: string): Observable<ApiResponse<ConversationThread>> {
    return this.api.post(`${this.base}/${conversationId}/reply`, { body });
  }

  getRecipients(): Observable<ApiResponse<MessageRecipient[]>> {
    return this.api.get<MessageRecipient[]>(`${this.base}/recipients`);
  }

  start(recipient: MessageRecipient, body: string): Observable<ApiResponse<{ conversation_id: number }>> {
    return this.api.post(this.base, {
      recipient_type: recipient.recipient_type,
      recipient_id: recipient.recipient_id,
      course_id: recipient.course_id,
      body,
    });
  }
}
