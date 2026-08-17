import { render } from "@react-email/render";

import { PasswordResetEmail } from "../templates/password-reset-email";
import type { SendPasswordResetEmailInput } from "../types";
import { getEmailConfig } from "./email-config";
import { sendEmail } from "./email-service";

export async function sendBrandedPasswordResetEmail({
  to,
  recipientName,
  passwordResetLink,
}: SendPasswordResetEmailInput) {
  const config = getEmailConfig();
  const templateData = {
    platformTitle: config.platformTitle,
    teacherName: config.teacherName,
    recipientName,
    passwordResetLink,
    appUrl: config.appUrl,
  };
  const email = <PasswordResetEmail {...templateData} />;
  const html = await render(email);
  const text = await render(email, { plainText: true });
  const subject = `Reset your ${config.teacherName} Mathematics Platform password`;

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}
