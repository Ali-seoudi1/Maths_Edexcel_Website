import { randomBytes } from "node:crypto";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";

import type { EditStudentFormValues, StudentFormValues } from "../schemas";
import type { Student } from "../types";

function generateTemporaryPassword() {
  return `Edx-${randomBytes(9).toString("base64url")}1!`;
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

export async function createStudentAccount(values: StudentFormValues) {
  const temporaryPassword = generateTemporaryPassword();
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  const user = await auth.createUser({
    email: values.email,
    password: temporaryPassword,
    displayName: values.fullName,
    disabled: false,
  });

  const profile = {
    uid: user.uid,
    fullName: values.fullName,
    email: values.email,
    role: "student" as const,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
  };

  await db.collection("users").doc(user.uid).set(profile);
  const snapshot = await db.collection("users").doc(user.uid).get();

  return {
    student: toStudent(user.uid, snapshot.data() ?? profile),
    temporaryPassword,
  };
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

export async function softDeleteStudentAccount(uid: string) {
  const db = getFirebaseAdminDb();
  const auth = getFirebaseAdminAuth();
  const ref = db.collection("users").doc(uid);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.role !== "student") {
    throw new Error("Student account was not found.");
  }

  await auth.updateUser(uid, { disabled: true });
  await ref.update({
    active: false,
    deletedAt: FieldValue.serverTimestamp(),
  });

  const updatedSnapshot = await ref.get();

  return toStudent(uid, updatedSnapshot.data() ?? {});
}
