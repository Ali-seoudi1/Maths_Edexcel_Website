export type NotificationType =
  | "assignment"
  | "assignment_grade"
  | "quiz_grade"
  | "exam_grade"
  | "quiz_scheduled"
  | "exam_scheduled"
  | "quiz_feedback"
  | "exam_feedback"
  | "announcement"
  | "live_meeting"
  | "monthly_report";

export type StudentNotification = {
  id: string;
  studentId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  relatedId: string | null;
  read: boolean;
  createdAt: string | null;
};

export type CreateNotificationInput = {
  studentId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  relatedId?: string | null;
};
