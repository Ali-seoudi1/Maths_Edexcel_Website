import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb, getFirebaseAdminStorageBucket } from "@/lib/firebase/admin";

import type {
  Quiz,
  QuizFormValues,
  QuizGradeValues,
  QuizStatus,
  QuizSubmission,
} from "../types";

export const quizzesCollection = "quizzes";
export const quizSubmissionsCollection = "quizSubmissions";
export const quizPdfFolder = "quiz-pdfs";
export const quizSubmissionFolder = "quiz-submissions";

function normalizeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
}

function getTimestamp(value: unknown): Timestamp | null {
  if (value instanceof Timestamp) return value;
  if (typeof value === "string") {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? null : Timestamp.fromDate(new Date(time));
  }
  return null;
}

function getStatus(published: boolean, expiresAt: string | null): QuizStatus {
  if (!published) return "draft";
  if (expiresAt && Date.now() > new Date(expiresAt).getTime()) return "closed";
  return "active";
}

function getSafeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function uploadPdf(file: File, folder: string) {
  if (file.type !== "application/pdf") {
    throw new Error("Upload a PDF file.");
  }

  const path = `${folder}/${crypto.randomUUID()}-${getSafeFileName(file.name)}`;
  const storageFile = getFirebaseAdminStorageBucket().file(path);

  await storageFile.save(Buffer.from(await file.arrayBuffer()), {
    contentType: "application/pdf",
    resumable: false,
    metadata: {
      cacheControl: "private, max-age=300",
    },
  });

  return { id: crypto.randomUUID(), path, fileName: file.name };
}

async function deleteStorageFile(path: string) {
  if (!path) return;

  try {
    await getFirebaseAdminStorageBucket().file(path).delete();
  } catch {
    // Missing storage objects should not block quiz cleanup.
  }
}

function toQuiz(id: string, data: FirebaseFirestore.DocumentData): Quiz {
  const published = data.published === true;
  const expiresAt = normalizeTimestamp(data.expiresAt);
  const legacyPdfPath =
    typeof data.pdfPath === "string" ? data.pdfPath : typeof data.pdfUrl === "string" ? data.pdfUrl : "";
  const legacyPdfFileName = typeof data.pdfFileName === "string" ? data.pdfFileName : "";
  const pdfs = Array.isArray(data.pdfs)
    ? data.pdfs
        .filter((pdf) => pdf && typeof pdf === "object")
        .map((pdf) => ({
          id: typeof (pdf as { id?: string }).id === "string" ? (pdf as { id: string }).id : crypto.randomUUID(),
          path: typeof (pdf as { path?: string }).path === "string" ? (pdf as { path: string }).path : "",
          fileName:
            typeof (pdf as { fileName?: string }).fileName === "string"
              ? (pdf as { fileName: string }).fileName
              : "",
        }))
        .filter((pdf) => pdf.path && pdf.fileName)
    : [];
  const normalizedPdfs =
    pdfs.length > 0 || !legacyPdfPath
      ? pdfs
      : [{ id: "legacy-primary-pdf", path: legacyPdfPath, fileName: legacyPdfFileName || "Quiz.pdf" }];

  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    durationMinutes: typeof data.durationMinutes === "number" ? data.durationMinutes : 0,
    pdfs: normalizedPdfs,
    published,
    publishedAt: normalizeTimestamp(data.publishedAt),
    expiresAt,
    status: getStatus(published, expiresAt),
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function toQuizSubmission(id: string, data: FirebaseFirestore.DocumentData): QuizSubmission {
  const status = data.status === "graded" ? "graded" : data.late === true ? "late" : "submitted";
  const pdfPath =
    typeof data.pdfPath === "string"
      ? data.pdfPath
      : typeof data.pdfUrl === "string"
        ? data.pdfUrl
        : "";

  return {
    id,
    quizId: typeof data.quizId === "string" ? data.quizId : "",
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    studentName: typeof data.studentName === "string" ? data.studentName : "Student",
    pdfPath,
    pdfFileName: typeof data.pdfFileName === "string" ? data.pdfFileName : "",
    submittedAt: normalizeTimestamp(data.submittedAt),
    late: data.late === true,
    lateBySeconds: typeof data.lateBySeconds === "number" ? data.lateBySeconds : 0,
    status,
    finalized: data.finalized !== false,
    graded: data.graded === true || status === "graded",
    gradedAt: normalizeTimestamp(data.gradedAt),
    gradedBy: typeof data.gradedBy === "string" ? data.gradedBy : "",
    score: typeof data.score === "number" ? data.score : null,
    feedback: typeof data.feedback === "string" ? data.feedback : "",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function getSubmissionDocumentId(quizId: string, studentId: string) {
  return `${quizId}_${studentId}`;
}

function sortQuizzes(quizzes: Quiz[]) {
  return quizzes.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function getServerNowIso() {
  return Timestamp.now().toDate().toISOString();
}

export async function listQuizzes(options: { publishedOnly?: boolean } = {}) {
  let query: FirebaseFirestore.Query = getFirebaseAdminDb().collection(quizzesCollection);

  if (options.publishedOnly) {
    query = query.where("published", "==", true);
  }

  const snapshot = await query.get();

  return sortQuizzes(snapshot.docs.map((documentSnapshot) => toQuiz(documentSnapshot.id, documentSnapshot.data())));
}

export async function getQuizById(id: string, options: { publishedOnly?: boolean } = {}) {
  const snapshot = await getFirebaseAdminDb().collection(quizzesCollection).doc(id).get();

  if (!snapshot.exists) return null;

  const quiz = toQuiz(snapshot.id, snapshot.data() ?? {});

  if (options.publishedOnly && !quiz.published) return null;

  return quiz;
}

export async function createQuiz(values: QuizFormValues, pdfFiles: File[], adminId: string) {
  if (pdfFiles.length === 0) {
    throw new Error("Upload at least one quiz PDF.");
  }

  const pdfs = await Promise.all(pdfFiles.map((file) => uploadPdf(file, quizPdfFolder)));
  const ref = getFirebaseAdminDb().collection(quizzesCollection).doc();
  const shouldPublish = values.published === true;
  const publishedAt = shouldPublish ? Timestamp.now() : null;
  const expiresAt = publishedAt
    ? Timestamp.fromMillis(publishedAt.toMillis() + values.durationMinutes * 60 * 1000)
    : null;
  const record = {
    title: values.title,
    description: values.description,
    durationMinutes: values.durationMinutes,
    pdfs,
    published: shouldPublish,
    publishedAt,
    expiresAt,
    createdBy: adminId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record);
  const snapshot = await ref.get();

  return toQuiz(snapshot.id, snapshot.data() ?? record);
}

export async function updateQuiz(
  id: string,
  values: QuizFormValues,
  pdfFiles: File[],
  removedPdfIds: string[],
) {
  const ref = getFirebaseAdminDb().collection(quizzesCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Quiz was not found.");
  }

  const existing = toQuiz(snapshot.id, snapshot.data() ?? {});
  const nextPdfs = await Promise.all(pdfFiles.map((file) => uploadPdf(file, quizPdfFolder)));
  const removedPdfIdSet = new Set(removedPdfIds);
  const retainedPdfs = existing.pdfs.filter((pdf) => !removedPdfIdSet.has(pdf.id));
  const pdfs = [...retainedPdfs, ...nextPdfs];

  if (pdfs.length === 0) {
    await Promise.all(nextPdfs.map((pdf) => deleteStorageFile(pdf.path)));
    throw new Error("A quiz must have at least one PDF.");
  }

  const shouldPublish = values.published === true;
  const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
    title: values.title,
    description: values.description,
    durationMinutes: values.durationMinutes,
    pdfs,
    published: shouldPublish,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (shouldPublish && !existing.published) {
    const publishedAt = Timestamp.now();
    update.publishedAt = publishedAt;
    update.expiresAt = Timestamp.fromMillis(publishedAt.toMillis() + values.durationMinutes * 60 * 1000);
  }

  if (!shouldPublish && existing.published) {
    update.publishedAt = null;
    update.expiresAt = null;
  }

  await ref.update(update);

  await Promise.all(existing.pdfs.filter((pdf) => removedPdfIdSet.has(pdf.id)).map((pdf) => deleteStorageFile(pdf.path)));

  const updated = await ref.get();

  return toQuiz(updated.id, updated.data() ?? {});
}

export async function deleteQuiz(id: string) {
  const ref = getFirebaseAdminDb().collection(quizzesCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Quiz was not found.");
  }

  const quiz = toQuiz(snapshot.id, snapshot.data() ?? {});
  await ref.delete();
  await Promise.all(quiz.pdfs.map((pdf) => deleteStorageFile(pdf.path)));

  const submissions = await getFirebaseAdminDb()
    .collection(quizSubmissionsCollection)
    .where("quizId", "==", id)
    .get();

  await Promise.all(
    submissions.docs.map(async (doc) => {
      const submission = toQuizSubmission(doc.id, doc.data());
      await doc.ref.delete();
      await deleteStorageFile(submission.pdfPath);
    }),
  );

  return { deletedQuizId: id };
}

export async function getStudentQuizSubmission(quizId: string, studentId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(quizSubmissionsCollection)
    .doc(getSubmissionDocumentId(quizId, studentId))
    .get();

  if (!snapshot.exists) return null;

  return toQuizSubmission(snapshot.id, snapshot.data() ?? {});
}

export async function startQuiz(quizId: string, studentId: string, studentName: string) {
  const quiz = await getQuizById(quizId, { publishedOnly: true });

  if (!quiz) {
    throw new Error("Quiz was not found.");
  }

  if (quiz.status !== "active") {
    throw new Error("This quiz is closed.");
  }

  const ref = getFirebaseAdminDb().collection("quizAttempts").doc(getSubmissionDocumentId(quizId, studentId));
  await ref.set(
    {
      quizId,
      studentId,
      studentName,
      openedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { quiz, serverNow: getServerNowIso() };
}

export async function submitQuizPdf(
  quizId: string,
  studentId: string,
  studentName: string,
  pdfFile: File,
) {
  const quiz = await getQuizById(quizId, { publishedOnly: true });

  if (!quiz) {
    throw new Error("Quiz was not found.");
  }

  const deadline = getTimestamp(quiz.expiresAt);
  const submittedAt = Timestamp.now();
  const lateBySeconds = deadline
    ? Math.max(0, Math.floor((submittedAt.toMillis() - deadline.toMillis()) / 1000))
    : 0;
  const late = lateBySeconds > 0;
  const pdf = await uploadPdf(pdfFile, quizSubmissionFolder);
  const ref = getFirebaseAdminDb()
    .collection(quizSubmissionsCollection)
    .doc(getSubmissionDocumentId(quizId, studentId));
  const existing = await ref.get();
  const existingSubmission = existing.exists ? toQuizSubmission(existing.id, existing.data() ?? {}) : null;

  await ref.set(
    {
      quizId,
      studentId,
      studentName,
      pdfPath: pdf.path,
      pdfFileName: pdf.fileName,
      submittedAt,
      late,
      lateBySeconds,
      status: late ? "late" : "submitted",
      finalized: true,
      graded: false,
      gradedAt: null,
      gradedBy: "",
      score: null,
      feedback: "",
      createdAt: existing.exists ? existing.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  if (existingSubmission?.pdfPath) {
    await deleteStorageFile(existingSubmission.pdfPath);
  }

  const saved = await ref.get();

  return toQuizSubmission(saved.id, saved.data() ?? {});
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

export async function gradeQuizSubmission(
  quizId: string,
  submissionId: string,
  values: QuizGradeValues,
  adminId: string,
) {
  const quiz = await getQuizById(quizId);

  if (!quiz) {
    throw new Error("Quiz was not found.");
  }

  const ref = getFirebaseAdminDb().collection(quizSubmissionsCollection).doc(submissionId);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.quizId !== quizId) {
    throw new Error("Submission was not found.");
  }

  await ref.update({
    score: typeof values.score === "number" ? values.score : null,
    feedback: values.feedback ?? "",
    status: "graded",
    graded: true,
    gradedAt: FieldValue.serverTimestamp(),
    gradedBy: adminId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await ref.get();

  return toQuizSubmission(updated.id, updated.data() ?? {});
}

export async function getQuizPdfBuffer(id: string, pdfId?: string | null) {
  const quiz = await getQuizById(id, { publishedOnly: true });

  if (!quiz) return null;

  const pdf = (pdfId ? quiz.pdfs.find((item) => item.id === pdfId) : quiz.pdfs[0]) ?? null;

  if (!pdf) return null;

  const [buffer] = await getFirebaseAdminStorageBucket().file(pdf.path).download();

  return { buffer, fileName: pdf.fileName };
}

export async function getAdminQuizPdfBuffer(id: string, pdfId?: string | null) {
  const quiz = await getQuizById(id);

  if (!quiz) return null;

  const pdf = (pdfId ? quiz.pdfs.find((item) => item.id === pdfId) : quiz.pdfs[0]) ?? null;

  if (!pdf) return null;

  const [buffer] = await getFirebaseAdminStorageBucket().file(pdf.path).download();

  return { buffer, fileName: pdf.fileName };
}

export async function getSubmissionPdfBuffer(quizId: string, submissionId: string) {
  const submissionSnapshot = await getFirebaseAdminDb()
    .collection(quizSubmissionsCollection)
    .doc(submissionId)
    .get();

  if (!submissionSnapshot.exists || submissionSnapshot.data()?.quizId !== quizId) {
    return null;
  }

  const submission = toQuizSubmission(submissionSnapshot.id, submissionSnapshot.data() ?? {});
  const [buffer] = await getFirebaseAdminStorageBucket().file(submission.pdfPath).download();

  return { buffer, fileName: submission.pdfFileName };
}
