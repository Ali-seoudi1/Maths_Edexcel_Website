import { render } from "@react-email/render";

import { StudentInvitationEmail } from "../templates/student-invitation-email";
import type { SendStudentInvitationEmailInput } from "../types";
import { getEmailConfig } from "./email-config";
import { sendEmail } from "./email-service";

export async function sendStudentInvitationEmail({
  to,
  studentName,
  passwordSetupLink,
}: SendStudentInvitationEmailInput) {
  const config = getEmailConfig();
  const templateData = {
    platformTitle: config.platformTitle,
    teacherName: config.teacherName,
    studentName,
    passwordSetupLink,
    appUrl: config.appUrl,
  };
  const email = <StudentInvitationEmail {...templateData} />;
  const html = await render(email);
  const text = await render(email, { plainText: true });
  const subject = `Welcome to ${config.teacherName} Mathematics Platform`;

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}
