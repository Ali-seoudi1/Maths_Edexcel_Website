import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getEmailConfig, sendStudentInvitationEmail } from "@/features/email";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";

import type { EditStudentFormValues, StudentFormValues } from "../schemas";
import type { Student } from "../types";

const staleStudentCollections = ["users", "students"] as const;
const countersCollection = "systemCounters";
const studentCodeCounterDocument = "studentCodes";

function formatStudentCode(values: Pick<StudentFormValues, "yearGroup" | "mathTrack">, sequence: number) {
  return `STU-${values.yearGroup}-${values.mathTrack}-${String(sequence).padStart(3, "0")}`;
}

function getStudentCodeSequence(studentCode: unknown) {
  if (typeof studentCode !== "string") {
    return null;
  }

  const match = /-(\d+)$/.exec(studentCode);
  return match ? Number(match[1]) : null;
}

function getErrorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error ? String(error.code) : "";
}

function isUserNotFoundError(error: unknown) {
  return getErrorCode(error) === "auth/user-not-found";
}

function isEmailAlreadyExistsError(error: unknown) {
  return getErrorCode(error) === "auth/email-already-exists";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getPasswordSetupContinueUrl() {
  return `${getEmailConfig().appUrl}/sign-in`;
}

async function createPasswordSetupLink(email: string) {
  return getFirebaseAdminAuth().generatePasswordResetLink(email, {
    url: getPasswordSetupContinueUrl(),
    handleCodeInApp: false,
  });
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
    studentCode: typeof data.studentCode === "string" ? data.studentCode : uid,
    yearGroup: typeof data.yearGroup === "string" ? data.yearGroup : "",
    mathTrack: typeof data.mathTrack === "string" ? data.mathTrack : "",
    role: "student",
    active: data.active === true,
    isTestAccount: data.isTestAccount === true,
    createdAt: normalizeCreatedAt(data.createdAt),
  };
}

async function createNextStudentCode(values: Pick<StudentFormValues, "yearGroup" | "mathTrack">) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(countersCollection).doc(studentCodeCounterDocument);
  const existingStudents = await db.collection("users").where("role", "==", "student").get();
  const initialSequence = existingStudents.size + 1;

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const rawNextSequence = snapshot.data()?.nextSequence;
    const nextSequence =
      typeof rawNextSequence === "number" && rawNextSequence > 0 ? rawNextSequence : initialSequence;

    transaction.set(
      ref,
      {
        nextSequence: nextSequence + 1,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return formatStudentCode(values, nextSequence);
  });
}

export async function createStudentAccount(values: StudentFormValues) {
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  const email = normalizeEmail(values.email);
  getEmailConfig();
  await assertEmailIsReusable(email);

  let user = null;

  try {
    user = await auth.createUser({
      email,
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

  try {
    const studentCode = await createNextStudentCode(values);
    const profile = {
      uid: user.uid,
      fullName: values.fullName,
      email,
      studentCode,
      yearGroup: values.yearGroup,
      mathTrack: values.mathTrack,
      role: "student" as const,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(user.uid).set(profile);

    try {
      const passwordSetupLink = await createPasswordSetupLink(email);
      await sendStudentInvitationEmail({
        to: email,
        studentName: values.fullName,
        passwordSetupLink,
      });
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
  } catch (error) {
    await auth.deleteUser(user.uid).catch(() => undefined);
    throw error;
  }
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

  const email = normalizeEmail(values.email);
  const existingCodeSequence = getStudentCodeSequence(snapshot.data()?.studentCode);
  const nextProfileValues = {
    fullName: values.fullName,
    email,
    yearGroup: values.yearGroup,
    mathTrack: values.mathTrack,
    active: values.active,
  };

  await auth.updateUser(uid, {
    email,
    displayName: values.fullName,
    disabled: !values.active,
  });

  await ref.update({
    ...nextProfileValues,
    ...(existingCodeSequence ? { studentCode: formatStudentCode(values, existingCodeSequence) } : {}),
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
