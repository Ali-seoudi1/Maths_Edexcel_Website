export type NotificationType =
  | "assignment"
  | "quiz_grade"
  | "exam_grade"
  | "announcement"
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
