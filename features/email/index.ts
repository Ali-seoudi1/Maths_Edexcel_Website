export { getEmailConfig, getMissingEmailEnv } from "./services/email-config";
export { sendEmail } from "./services/email-service";
export { sendStudentInvitationEmail } from "./services/student-invitation-email-service";
export type {
  EmailAddress,
  SendEmailInput,
  SendStudentInvitationEmailInput,
  StudentInvitationEmailData,
} from "./types";
