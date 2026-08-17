export { getEmailConfig, getMissingEmailEnv } from "./services/email-config";
export { sendEmail } from "./services/email-service";
export { sendBrandedPasswordResetEmail } from "./services/password-reset-email-service";
export { sendStudentInvitationEmail } from "./services/student-invitation-email-service";
export type {
  EmailAddress,
  PasswordResetEmailData,
  SendPasswordResetEmailInput,
  SendEmailInput,
  SendStudentInvitationEmailInput,
  StudentInvitationEmailData,
} from "./types";
