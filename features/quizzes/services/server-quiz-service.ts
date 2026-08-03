import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb, getFirebaseAdminStorageBucket } from "@/lib/firebase/admin";

import type { Quiz, QuizFormValues, QuizQuestion, QuizSubmission } from "../types";

export const quizzesCollection = "quizzes";
export const quizSubmissionsCollection = "quizSubmissions";
export const quizPdfFolder = "quiz-pdfs";

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

function normalizeQuestions(data: unknown): QuizQuestion[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: typeof (item as { id?: string }).id === "string" ? (item as { id: string }).id : crypto.randomUUID(),
      prompt: typeof (item as { prompt?: string }).prompt === "string" ? (item as { prompt: string }).prompt : "",
      options: Array.isArray((item as { options?: string[] }).options)
        ? (item as { options: string[] }).options.map((option) => String(option))
        : [],
      correctIndex:
        typeof (item as { correctIndex?: number }).correctIndex === "number"
          ? (item as { correctIndex: number }).correctIndex
          : 0,
    }))
    .filter((question) => question.prompt.trim().length > 0);
}

function getSafeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function uploadQuizPdf(file: File) {
  if (file.type !== "application/pdf") {
    throw new Error("Upload a PDF file.");
  }

  const path = `${quizPdfFolder}/${crypto.randomUUID()}-${getSafeFileName(file.name)}`;
  const bucket = getFirebaseAdminStorageBucket();
  const storageFile = bucket.file(path);

  await storageFile.save(Buffer.from(await file.arrayBuffer()), {
    contentType: "application/pdf",
    resumable: false,
    metadata: {
      cacheControl: "private, max-age=300",
    },
  });

  return { path, fileName: file.name };
}

async function deleteStorageFile(path: string) {
  if (!path) {
    return;
  }

  try {
    await getFirebaseAdminStorageBucket().file(path).delete();
  } catch {
    // ignore missing files during cleanup
  }
}

function toQuiz(id: string, data: FirebaseFirestore.DocumentData): Quiz {
  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    durationMinutes: typeof data.durationMinutes === "number" ? data.durationMinutes : 0,
    pdfUrl: typeof data.pdfUrl === "string" ? data.pdfUrl : "",
    pdfFileName: typeof data.pdfFileName === "string" ? data.pdfFileName : "",
    questions: normalizeQuestions(data.questions),
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function toQuizSubmission(id: string, data: FirebaseFirestore.DocumentData): QuizSubmission {
  return {
    id,
    quizId: typeof data.quizId === "string" ? data.quizId : "",
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    studentName: typeof data.studentName === "string" ? data.studentName : "Student",
    startedAt: normalizeTimestamp(data.startedAt),
    submittedAt: normalizeTimestamp(data.submittedAt),
    score: typeof data.score === "number" ? data.score : 0,
    totalQuestions: typeof data.totalQuestions === "number" ? data.totalQuestions : 0,
    answers: typeof data.answers === "object" && data.answers !== null ? data.answers : {},
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function getSubmissionDocumentId(quizId: string, studentId: string) {
  return `${quizId}_${studentId}`;
}

export async function listQuizzes() {
  const snapshot = await getFirebaseAdminDb().collection(quizzesCollection).get();

  return snapshot.docs
    .map((documentSnapshot) => toQuiz(documentSnapshot.id, documentSnapshot.data()))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getQuizById(id: string) {
  const snapshot = await getFirebaseAdminDb().collection(quizzesCollection).doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  return toQuiz(snapshot.id, snapshot.data() ?? {});
}

export async function createQuiz(values: QuizFormValues, pdfFile: File, adminId: string) {
  const pdf = await uploadQuizPdf(pdfFile);
  const ref = getFirebaseAdminDb().collection(quizzesCollection).doc();
  const record = {
    ...values,
    pdfUrl: pdf.path,
    pdfFileName: pdf.fileName,
    createdBy: adminId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record);
  const snapshot = await ref.get();

  return toQuiz(snapshot.id, snapshot.data() ?? record);
}

export async function deleteQuiz(id: string) {
  const ref = getFirebaseAdminDb().collection(quizzesCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Quiz was not found.");
  }

  const quiz = toQuiz(snapshot.id, snapshot.data() ?? {});
  await ref.delete();
  await deleteStorageFile(quiz.pdfUrl);

  const submissions = await getFirebaseAdminDb()
    .collection(quizSubmissionsCollection)
    .where("quizId", "==", id)
    .get();

  await Promise.all(submissions.docs.map((doc) => doc.ref.delete()));

  return { deletedQuizId: id };
}

export async function getStudentQuizSubmission(quizId: string, studentId: string) {
  const quiz = await getQuizById(quizId);

  if (!quiz) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection(quizSubmissionsCollection)
    .doc(getSubmissionDocumentId(quizId, studentId))
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return toQuizSubmission(snapshot.id, snapshot.data() ?? {});
}

export async function startQuiz(quizId: string, studentId: string, studentName: string) {
  const quiz = await getQuizById(quizId);

  if (!quiz) {
    throw new Error("Quiz was not found.");
  }

  const ref = getFirebaseAdminDb().collection(quizSubmissionsCollection).doc(getSubmissionDocumentId(quizId, studentId));
  const snapshot = await ref.get();

  if (snapshot.exists) {
    return toQuizSubmission(snapshot.id, snapshot.data() ?? {});
  }

  const record = {
    quizId,
    studentId,
    studentName,
    startedAt: FieldValue.serverTimestamp(),
    submittedAt: null,
    score: 0,
    totalQuestions: quiz.questions.length,
    answers: {},
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record);
  const saved = await ref.get();

  return toQuizSubmission(saved.id, saved.data() ?? record);
}

export async function submitQuizAnswers(
  quizId: string,
  studentId: string,
  answers: Record<string, number>,
) {
  const quiz = await getQuizById(quizId);

  if (!quiz) {
    throw new Error("Quiz was not found.");
  }

  const ref = getFirebaseAdminDb().collection(quizSubmissionsCollection).doc(getSubmissionDocumentId(quizId, studentId));
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Quiz submission was not started.");
  }

  const data = snapshot.data() ?? {};
  const totalQuestions = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
  let score = 0;

  for (const question of quiz.questions) {
    const selectedIndex = answers[question.id];
    if (selectedIndex === question.correctIndex) {
      score += 1;
    }
  }

  await ref.update({
    answers,
    score,
    totalQuestions,
    submittedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await ref.get();

  return toQuizSubmission(updated.id, updated.data() ?? data);
}

export async function listQuizSubmissions(quizId: string) {
  const quiz = await getQuizById(quizId);

  if (!quiz) {
    throw new Error("Quiz was not found.");
  }

  const snapshot = await getFirebaseAdminDb()
    .collection(quizSubmissionsCollection)
    .where("quizId", "==", quizId)
    .get();

  return snapshot.docs
    .map((documentSnapshot) => toQuizSubmission(documentSnapshot.id, documentSnapshot.data()))
    .sort((a, b) => {
      const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return bTime - aTime;
    });
}

export async function getQuizPdfBuffer(id: string) {
  const quiz = await getQuizById(id);

  if (!quiz) {
    return null;
  }

  const [buffer] = await getFirebaseAdminStorageBucket().file(quiz.pdfUrl).download();

  return { buffer, fileName: quiz.pdfFileName };
}
