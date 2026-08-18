import { getEmailConfig, sendBrandedPasswordResetEmail } from "@/features/email";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";

const unregisteredAccountMessage = "This account is not registered.";

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

async function getRegisteredPlatformUser(email: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const data = snapshot.docs[0].data();

  return {
    fullName: typeof data.fullName === "string" ? data.fullName : "",
    active: data.active === true,
  };
}

export async function sendPasswordResetWithResend(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const auth = getFirebaseAdminAuth();
  const registeredUser = await getRegisteredPlatformUser(normalizedEmail);

  if (!registeredUser) {
    throw new Error(unregisteredAccountMessage);
  }

  if (!registeredUser.active) {
    throw new Error("This account is inactive. Please contact the teacher.");
  }

  let user;

  try {
    user = await auth.getUserByEmail(normalizedEmail);
  } catch (error) {
    if (isUserNotFoundError(error)) {
      throw new Error(unregisteredAccountMessage);
    }

    throw error;
  }

  const passwordResetLink = await auth.generatePasswordResetLink(normalizedEmail, {
    url: getPasswordResetContinueUrl(),
    handleCodeInApp: false,
  });

  await sendBrandedPasswordResetEmail({
    to: normalizedEmail,
    recipientName: registeredUser.fullName || user.displayName || "there",
    passwordResetLink,
  });
}
