import { randomBytes } from "node:crypto";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";

import type { EditStudentFormValues, StudentFormValues } from "../schemas";
import type { Student } from "../types";

const staleStudentCollections = ["users", "students"] as const;

function getErrorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error ? String(error.code) : "";
}

function isUserNotFoundError(error: unknown) {
  return getErrorCode(error) === "auth/user-not-found";
}

function isEmailAlreadyExistsError(error: unknown) {
  return getErrorCode(error) === "auth/email-already-exists";
}

function generateHiddenInitialPassword() {
  return `Edx-${randomBytes(18).toString("base64url")}1!`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getPasswordSetupContinueUrl(origin?: string) {
  if (origin) {
    return `${origin}/sign-in`;
  }

  return process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/sign-in`
    : undefined;
}

async function sendFirebasePasswordSetupEmail(email: string, origin?: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Firebase API key for password setup email.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email,
        continueUrl: getPasswordSetupContinueUrl(origin),
      }),
    },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as unknown;
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : "Firebase did not send the password setup email.";

    throw new Error(message);
  }
}

function normalizeCreatedAt(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
}

async function deleteStudentDocumentsByEmail(email: string) {
  const db = getFirebaseAdminDb();
  const batch = db.batch();
  let deleteCount = 0;

  for (const collectionName of staleStudentCollections) {
    const snapshot = await db
      .collection(collectionName)
      .where("email", "==", email)
      .where("role", "==", "student")
      .get();

    snapshot.docs.forEach((studentDoc) => {
      batch.delete(studentDoc.ref);
      deleteCount += 1;
    });
  }

  if (deleteCount > 0) {
    await batch.commit();
  }
}

async function assertEmailIsReusable(email: string) {
  const auth = getFirebaseAdminAuth();

  try {
    await auth.getUserByEmail(email);
    throw new Error("A Firebase Authentication user already exists with this email.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      throw error;
    }

    if (!isUserNotFoundError(error)) {
      throw error;
    }
  }

  await deleteStudentDocumentsByEmail(email);
}

function toStudent(uid: string, data: FirebaseFirestore.DocumentData): Student {
  return {
    uid,
    fullName: typeof data.fullName === "string" ? data.fullName : "",
    email: typeof data.email === "string" ? data.email : "",
    role: "student",
    active: data.active === true,
    createdAt: normalizeCreatedAt(data.createdAt),
  };
}

export async function createStudentAccount(values: StudentFormValues, origin?: string) {
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  const email = normalizeEmail(values.email);
  await assertEmailIsReusable(email);

  let user = null;

  try {
    user = await auth.createUser({
      email,
      password: generateHiddenInitialPassword(),
      displayName: values.fullName,
      disabled: false,
      emailVerified: false,
    });
  } catch (error) {
    if (isEmailAlreadyExistsError(error)) {
      throw new Error("A Firebase Authentication user already exists with this email.");
    }

    throw error;
  }

  const profile = {
    uid: user.uid,
    fullName: values.fullName,
    email,
    role: "student" as const,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("users").doc(user.uid).set(profile);
  } catch (error) {
    await auth.deleteUser(user.uid).catch(() => undefined);
    throw error;
  }

  try {
    await sendFirebasePasswordSetupEmail(email, origin);
  } catch (error) {
    await db
      .collection("users")
      .doc(user.uid)
      .delete()
      .catch(() => undefined);
    await auth.deleteUser(user.uid).catch(() => undefined);
    throw error;
  }

  return {
    student: toStudent(user.uid, {
      ...profile,
      createdAt: new Date().toISOString(),
    }),
    invitationEmailSent: true,
  };
}

export async function listStudentAccounts() {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("users").where("role", "==", "student").get();

  return snapshot.docs
    .map((studentDoc) => toStudent(studentDoc.id, studentDoc.data()))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function updateStudentAccount(uid: string, values: EditStudentFormValues) {
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  const ref = db.collection("users").doc(uid);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.role !== "student") {
    throw new Error("Student account was not found.");
  }

  await auth.updateUser(uid, {
    email: values.email,
    displayName: values.fullName,
    disabled: !values.active,
  });

  await ref.update({
    fullName: values.fullName,
    email: values.email,
    active: values.active,
  });

  const updatedSnapshot = await ref.get();

  return toStudent(uid, updatedSnapshot.data() ?? {});
}

export async function deleteStudentAccount(uid: string) {
  const db = getFirebaseAdminDb();
  const auth = getFirebaseAdminAuth();
  const ref = db.collection("users").doc(uid);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.role !== "student") {
    throw new Error("Student account was not found.");
  }

  try {
    await auth.deleteUser(uid);
  } catch (error) {
    if (!isUserNotFoundError(error)) {
      throw error;
    }
  }

  const batch = db.batch();
  batch.delete(ref);
  batch.delete(db.collection("students").doc(uid));
  await batch.commit();

  return {
    deletedStudentId: uid,
  };
}
