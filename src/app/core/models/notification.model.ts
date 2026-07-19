/** Learner activity-notification types fired by the backend inbox (app/Notifications/*.php). */
export type NotificationType =
  | 'pending_grade'
  | 'rating_dropped'
  | 'assignment_completed'
  | 'course_assigned'
  | 'cohort_created'
  | 'broadcast'
  | string;

/** One entry from GET /notifications/mine (NotificationInboxResource). */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  meta: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}
