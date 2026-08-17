export type EmailAddress = string;

export type SendEmailInput = {
  to: EmailAddress;
  subject: string;
  html: string;
  text: string;
};

export type StudentInvitationEmailData = {
  platformTitle: string;
  teacherName: string;
  studentName: string;
  passwordSetupLink: string;
  appUrl: string;
};

export type SendStudentInvitationEmailInput = {
  to: EmailAddress;
  studentName: string;
  passwordSetupLink: string;
};

export type PasswordResetEmailData = {
  platformTitle: string;
  teacherName: string;
  recipientName: string;
  passwordResetLink: string;
  appUrl: string;
};

export type SendPasswordResetEmailInput = {
  to: EmailAddress;
  recipientName: string;
  passwordResetLink: string;
};
