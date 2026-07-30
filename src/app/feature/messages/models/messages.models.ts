/** Payloads for learner-web two-way Messages (/api/v1/learner/profile/messages). */

export type MessageRole = 'instructors' | 'admins' | 'learners';

export interface ConversationCounterpart {
  name: string;
  image: string | null;
  role: MessageRole;
}

export interface ConversationPreview {
  body: string;
  created_at: string | null;
  mine: boolean;
}

/** One row in the conversation list (Figma frame 841-42746). */
export interface Conversation {
  id: number;
  subject: string | null;
  course: { id: number; title: string } | null;
  counterpart: ConversationCounterpart;
  last_message: ConversationPreview | null;
  unread_count: number;
  last_message_at: string | null;
}

/** One bubble in a thread (Figma frame 841-43294). */
export interface ThreadMessage {
  id: number;
  body: string;
  mine: boolean;
  sender_name: string;
  created_at: string | null;
}

export interface ConversationThread {
  conversation: Conversation;
  messages: ThreadMessage[];
}

/** A person the learner can start a new conversation with (compose picker). */
export interface MessageRecipient {
  recipient_type: 'instructor' | 'admin' | 'learner' | 'user';
  recipient_id: number;
  name: string;
  image: string | null;
  /** Grouping bucket for the picker sections. */
  role: 'instructors' | 'admins' | 'learners';
  course_id?: number | null;
  course_title?: string | null;
}

/** A titled section of recipients in the compose picker. */
export interface RecipientGroup {
  role: 'instructors' | 'admins' | 'learners';
  labelKey: string;
  items: MessageRecipient[];
}

/** The All / Instructors / Admins filter tabs. */
export type MessageTab = 'all' | 'instructors' | 'admins';
