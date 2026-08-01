const requiredEmailEnv = ["RESEND_API_KEY", "MAIL_FROM", "APP_URL", "TEACHER_NAME"] as const;

export type EmailConfig = {
  resendApiKey: string;
  mailFrom: string;
  appUrl: string;
  teacherName: string;
  platformTitle: string;
};

function normalizeAppUrl(value: string) {
  return value.replace(/\/$/, "");
}

export function getMissingEmailEnv(): string[] {
  const envMap: Record<(typeof requiredEmailEnv)[number], string | undefined> = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    MAIL_FROM: process.env.MAIL_FROM,
    APP_URL: process.env.APP_URL,
    TEACHER_NAME: process.env.TEACHER_NAME,
  };

  return requiredEmailEnv.filter((key) => !envMap[key]);
}

export function getEmailConfig(): EmailConfig {
  const missingEnv = getMissingEmailEnv();

  if (missingEnv.length > 0) {
    throw new Error(
      `Missing email environment variables: ${missingEnv.join(
        ", ",
      )}. Add them before sending student invitation emails.`,
    );
  }

  return {
    resendApiKey: process.env.RESEND_API_KEY as string,
    mailFrom: process.env.MAIL_FROM as string,
    appUrl: normalizeAppUrl(process.env.APP_URL as string),
    teacherName: process.env.TEACHER_NAME as string,
    platformTitle: `${process.env.TEACHER_NAME as string} Mathematics Platform`,
  };
}
