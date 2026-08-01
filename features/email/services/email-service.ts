import { Resend } from "resend";

import { getEmailConfig } from "./email-config";
import type { SendEmailInput } from "../types";

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const config = getEmailConfig();
  const resend = new Resend(config.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: config.mailFrom,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
