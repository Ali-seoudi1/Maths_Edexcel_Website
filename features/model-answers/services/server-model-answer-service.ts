import { FieldValue, Timestamp } from "firebase-admin/firestore";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  getFirebaseAdminStorageBucket,
} from "@/lib/firebase/admin";

import { modelAnswerCollection } from "../constants";
import type { ModelAnswer, ModelAnswerFilters, ModelAnswerPayload } from "../types";
import { getModelAnswerId, normalizePaper, normalizeQuestionNumber } from "../utils";

function normalizeTimestamp(value: unknown): string | null {
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

function toModelAnswer(id: string, data: FirebaseFirestore.DocumentData): ModelAnswer {
  return {
    id,
    examYear: typeof data.examYear === "number" ? data.examYear : 0,
    session: data.session === "oct-nov" ? "oct-nov" : "may-june",
    paper: typeof data.paper === "string" ? data.paper : "",
    questionNumber: typeof data.questionNumber === "string" ? data.questionNumber : "",
    officialMarkSchemePath:
      typeof data.officialMarkSchemePath === "string" ? data.officialMarkSchemePath : "",
    officialMarkSchemeFileName:
      typeof data.officialMarkSchemeFileName === "string" ? data.officialMarkSchemeFileName : "",
    officialMarkSchemeType: data.officialMarkSchemeType === "image" ? "image" : "pdf",
    teacherSolutionHtml:
      typeof data.teacherSolutionHtml === "string" ? data.teacherSolutionHtml : "",
    published: data.published === true,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function normalizePayload(values: ModelAnswerPayload): ModelAnswerPayload {
  return {
    ...values,
    paper: normalizePaper(values.paper),
    questionNumber: normalizeQuestionNumber(values.questionNumber),
    published: true,
  };
}

function isStorageNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 404
  );
}

async function deleteOfficialMarkSchemeFile(storagePath: string) {
  if (!storagePath) {
    return;
  }

  try {
    await getFirebaseAdminStorageBucket().file(storagePath).delete();
  } catch (error) {
    if (!isStorageNotFoundError(error)) {
      throw error;
    }
  }
}

export async function requireActiveUser(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    throw new Error("Missing authentication token.");
  }

  const token = header.slice("Bearer ".length);
  const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
  const profileSnapshot = await getFirebaseAdminDb().collection("users").doc(decodedToken.uid).get();
  const profile = profileSnapshot.data();

  if (!profileSnapshot.exists || profile?.active !== true) {
    throw new Error("Active account access is required.");
  }

  return {
    uid: decodedToken.uid,
    role: profile.role === "admin" ? "admin" : "student",
  };
}

export async function listModelAnswers(filters: ModelAnswerFilters = {}) {
  let query: FirebaseFirestore.Query = getFirebaseAdminDb().collection(modelAnswerCollection);

  if (typeof filters.examYear === "number") {
    query = query.where("examYear", "==", filters.examYear);
  }

  if (filters.session) {
    query = query.where("session", "==", filters.session);
  }

  if (filters.paper) {
    query = query.where("paper", "==", normalizePaper(filters.paper));
  }

  if (filters.questionNumber) {
    query = query.where("questionNumber", "==", normalizeQuestionNumber(filters.questionNumber));
  }

  if (typeof filters.published === "boolean") {
    query = query.where("published", "==", filters.published);
  }

  const snapshot = await query.get();

  return snapshot.docs
    .map((documentSnapshot) => toModelAnswer(documentSnapshot.id, documentSnapshot.data()))
    .sort((a, b) => {
      if (a.examYear !== b.examYear) {
        return b.examYear - a.examYear;
      }

      return a.paper.localeCompare(b.paper) || a.questionNumber.localeCompare(b.questionNumber);
    });
}

export async function getModelAnswerById(id: string) {
  const snapshot = await getFirebaseAdminDb().collection(modelAnswerCollection).doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  return toModelAnswer(snapshot.id, snapshot.data() ?? {});
}

export async function createModelAnswer(values: ModelAnswerPayload, adminId: string) {
  const normalizedValues = normalizePayload(values);
  const id = getModelAnswerId(normalizedValues);
  const ref = getFirebaseAdminDb().collection(modelAnswerCollection).doc(id);
  const existing = await ref.get();

  if (existing.exists) {
    throw new Error("A key question already exists for this exam question.");
  }

  const record = {
    ...normalizedValues,
    createdBy: adminId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record);
  const snapshot = await ref.get();

  return toModelAnswer(snapshot.id, snapshot.data() ?? record);
}

export async function updateModelAnswer(id: string, values: ModelAnswerPayload, adminId: string) {
  const ref = getFirebaseAdminDb().collection(modelAnswerCollection).doc(id);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Model answer was not found.");
  }

  const existingModelAnswer = toModelAnswer(existing.id, existing.data() ?? {});
  const normalizedValues = normalizePayload(values);
  const nextId = getModelAnswerId(normalizedValues);

  if (nextId !== id) {
    const nextRef = getFirebaseAdminDb().collection(modelAnswerCollection).doc(nextId);
    const nextExisting = await nextRef.get();

    if (nextExisting.exists) {
      throw new Error("A key question already exists for this exam question.");
    }

    await nextRef.set({
      ...normalizedValues,
      createdBy: existing.data()?.createdBy ?? adminId,
      createdAt: existing.data()?.createdAt ?? FieldValue.serverTimestamp(),
      updatedBy: adminId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await ref.delete();
    if (existingModelAnswer.officialMarkSchemePath !== normalizedValues.officialMarkSchemePath) {
      await deleteOfficialMarkSchemeFile(existingModelAnswer.officialMarkSchemePath);
    }

    const snapshot = await nextRef.get();
    return toModelAnswer(snapshot.id, snapshot.data() ?? normalizedValues);
  }

  await ref.update({
    ...normalizedValues,
    updatedBy: adminId,
    updatedAt: FieldValue.serverTimestamp(),
  });
  if (existingModelAnswer.officialMarkSchemePath !== normalizedValues.officialMarkSchemePath) {
    await deleteOfficialMarkSchemeFile(existingModelAnswer.officialMarkSchemePath);
  }

  const snapshot = await ref.get();

  return toModelAnswer(snapshot.id, snapshot.data() ?? normalizedValues);
}

export async function deleteModelAnswer(id: string) {
  const ref = getFirebaseAdminDb().collection(modelAnswerCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Model answer was not found.");
  }

  const modelAnswer = toModelAnswer(snapshot.id, snapshot.data() ?? {});
  await ref.delete();
  await deleteOfficialMarkSchemeFile(modelAnswer.officialMarkSchemePath);

  return { deletedModelAnswerId: id };
}

export async function searchPublishedModelAnswer(filters: Required<ModelAnswerFilters>) {
  const id = getModelAnswerId(filters);
  const result = await getModelAnswerById(id);

  if (!result || !result.published) {
    return null;
  }

  return result;
}
