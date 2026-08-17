import { getEmailConfig, sendBrandedPasswordResetEmail } from "@/features/email";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getErrorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error ? String(error.code) : "";
}

function isUserNotFoundError(error: unknown) {
  return getErrorCode(error) === "auth/user-not-found";
}

function getPasswordResetContinueUrl() {
  return `${getEmailConfig().appUrl}/sign-in`;
}

export async function sendPasswordResetWithResend(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const auth = getFirebaseAdminAuth();

  let user;

  try {
    user = await auth.getUserByEmail(normalizedEmail);
  } catch (error) {
    if (isUserNotFoundError(error)) {
      return;
    }

    throw error;
  }

  const passwordResetLink = await auth.generatePasswordResetLink(normalizedEmail, {
    url: getPasswordResetContinueUrl(),
    handleCodeInApp: false,
  });

  await sendBrandedPasswordResetEmail({
    to: normalizedEmail,
    recipientName: user.displayName || "there",
    passwordResetLink,
  });
}
