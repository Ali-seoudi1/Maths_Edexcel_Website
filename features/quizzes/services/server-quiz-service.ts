import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb, getFirebaseAdminStorageBucket } from "@/lib/firebase/admin";
import {
  createNotification,
  replaceNotificationForAllActiveStudents,
} from "@/features/notifications/services/server-notification-service";
import {
  getStudentRegistrationDate,
  getTimedResourceRelevanceDate,
  isWorkRelevantToStudent,
  normalizeRegistrationDate,
} from "@/features/students/services/student-registration-service";

import type {
  Quiz,
  QuizAttempt,
  QuizFormValues,
  QuizGradeValues,
  QuizStatus,
  QuizSubmission,
} from "../types";

export const quizzesCollection = "quizzes";
export const quizSubmissionsCollection = "quizSubmissions";
export const quizAttemptsCollection = "quizAttempts";
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

function getStatus(published: boolean, scheduledAt: string | null, expiresAt: string | null): QuizStatus {
  if (!published) return "draft";
  if (scheduledAt && Date.now() < new Date(scheduledAt).getTime()) return "scheduled";
  if (expiresAt && Date.now() > new Date(expiresAt).getTime()) return "closed";
  return "active";
}

function parseScheduledAt(value: string | null | undefined) {
  if (!value) return null;

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    throw new Error("Enter a valid scheduled date and time.");
  }

  return Timestamp.fromMillis(time);
}

function getAvailabilityTimestamps(values: QuizFormValues, shouldPublish: boolean) {
  if (!shouldPublish) {
    return { scheduledAt: null, publishedAt: null, expiresAt: null };
  }

  const scheduledAt = parseScheduledAt(values.scheduledAt);
  const startsAt = scheduledAt ?? Timestamp.now();

  return {
    scheduledAt,
    publishedAt: startsAt,
    expiresAt: Timestamp.fromMillis(startsAt.toMillis() + values.durationMinutes * 60 * 1000),
  };
}

function formatSchedule(value: string | null) {
  if (!value) return "now";

  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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
    maxScore: typeof data.maxScore === "number" && data.maxScore > 0 ? data.maxScore : 100,
    pdfs: normalizedPdfs,
    published,
    scheduledAt: normalizeTimestamp(data.scheduledAt),
    publishedAt: normalizeTimestamp(data.publishedAt),
    expiresAt,
    status: getStatus(published, normalizeTimestamp(data.scheduledAt), expiresAt),
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function toQuizSubmission(id: string, data: FirebaseFirestore.DocumentData): QuizSubmission {
  const isCheatingRecord =
    data.status === "cheating" ||
    (data.noSubmission === true &&
      typeof data.feedback === "string" &&
      data.feedback.toLowerCase().includes("cheating"));
  const status =
    isCheatingRecord
      ? "cheating"
      : data.status === "graded"
        ? "graded"
        : data.late === true
          ? "late"
          : "submitted";
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
    noSubmission: data.noSubmission === true,
    pdfPath,
    pdfFileName: typeof data.pdfFileName === "string" ? data.pdfFileName : "",
    submittedAt: normalizeTimestamp(data.submittedAt),
    late: data.late === true,
    lateBySeconds: typeof data.lateBySeconds === "number" ? data.lateBySeconds : 0,
    cheatedAt: normalizeTimestamp(data.cheatedAt),
    status,
    finalized: data.finalized !== false,
    graded: status === "cheating" ? false : data.graded === true || status === "graded",
    gradedAt: normalizeTimestamp(data.gradedAt),
    gradedBy: typeof data.gradedBy === "string" ? data.gradedBy : "",
    score: typeof data.score === "number" ? data.score : null,
    maxScore: typeof data.maxScore === "number" && data.maxScore > 0 ? data.maxScore : 100,
    feedback: typeof data.feedback === "string" ? data.feedback : "",
    feedbackReturned: data.feedbackReturned === true,
    feedbackReturnedAt: normalizeTimestamp(data.feedbackReturnedAt),
    correctedPdfPath: typeof data.correctedPdfPath === "string" ? data.correctedPdfPath : "",
    correctedPdfFileName: typeof data.correctedPdfFileName === "string" ? data.correctedPdfFileName : "",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function toQuizAttempt(id: string, data: FirebaseFirestore.DocumentData): QuizAttempt {
  return {
    id,
    quizId: typeof data.quizId === "string" ? data.quizId : "",
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    studentName: typeof data.studentName === "string" ? data.studentName : "Student",
    openedAt: normalizeTimestamp(data.openedAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

async function hydrateSubmissionStudentNames(submissions: QuizSubmission[]) {
  const submissionsNeedingNames = submissions.filter(
    (submission) => !submission.studentName || submission.studentName === "Student",
  );

  if (submissionsNeedingNames.length === 0) {
    return submissions;
  }

  const db = getFirebaseAdminDb();
  const studentIds = Array.from(new Set(submissionsNeedingNames.map((submission) => submission.studentId)));
  const studentSnapshots = await db.getAll(...studentIds.map((studentId) => db.collection("users").doc(studentId)));
  const studentNames = new Map(
    studentSnapshots.map((snapshot) => {
      const data = snapshot.data();
      const fullName = typeof data?.fullName === "string" ? data.fullName : "";

      return [snapshot.id, fullName];
    }),
  );

  return submissions.map((submission) => {
    const fullName = studentNames.get(submission.studentId);

    if (!fullName) {
      return submission;
    }

    return {
      ...submission,
      studentName: fullName,
    };
  });
}

async function listStudentProfiles() {
  const snapshot = await getFirebaseAdminDb().collection("users").where("role", "==", "student").get();

  return snapshot.docs
    .map((studentDoc) => {
      const data = studentDoc.data();

      return {
        id: studentDoc.id,
        fullName: typeof data.fullName === "string" && data.fullName.trim() ? data.fullName : "Student",
        registrationDate: normalizeRegistrationDate(data.createdAt),
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/**
 * Keeps only the quizzes a specific student is responsible for: quizzes that
 * were published / scheduled on or after the student's registration day. Legacy
 * students without a stored registration date keep every quiz.
 */
export function filterQuizzesForStudent<
  T extends { publishedAt: string | null; scheduledAt: string | null; createdAt: string | null },
>(quizzes: T[], registrationDate: string | null): T[] {
  if (!registrationDate) {
    return quizzes;
  }

  return quizzes.filter((quiz) =>
    isWorkRelevantToStudent(getTimedResourceRelevanceDate(quiz), registrationDate),
  );
}

/** Quizzes visible to a student, filtered by their registration date. */
export async function listQuizzesForStudent(studentId: string) {
  const [quizzes, registrationDate] = await Promise.all([
    listQuizzes({ publishedOnly: true }),
    getStudentRegistrationDate(studentId),
  ]);

  return filterQuizzesForStudent(quizzes, registrationDate);
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
  const { scheduledAt, publishedAt, expiresAt } = getAvailabilityTimestamps(values, shouldPublish);
  const record = {
    title: values.title,
    description: values.description,
    durationMinutes: values.durationMinutes,
    maxScore: values.maxScore,
    pdfs,
    published: shouldPublish,
    scheduledAt,
    publishedAt,
    expiresAt,
    createdBy: adminId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record);
  const snapshot = await ref.get();
  const quiz = toQuiz(snapshot.id, snapshot.data() ?? record);

  if (quiz.published) {
    await notifyQuizScheduled(quiz);
  }

  return quiz;
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

  if (existing.status === "active" || existing.status === "closed") {
    throw new Error("Active or closed quizzes cannot be edited.");
  }

  const nextPdfs = await Promise.all(pdfFiles.map((file) => uploadPdf(file, quizPdfFolder)));
  const removedPdfIdSet = new Set(removedPdfIds);
  const retainedPdfs = existing.pdfs.filter((pdf) => !removedPdfIdSet.has(pdf.id));
  const pdfs = [...retainedPdfs, ...nextPdfs];

  if (pdfs.length === 0) {
    await Promise.all(nextPdfs.map((pdf) => deleteStorageFile(pdf.path)));
    throw new Error("A quiz must have at least one PDF.");
  }

  const shouldPublish = values.published === true;
  const wasPublished = existing.published;
  const previousScheduledAt = existing.scheduledAt;
  const availability = getAvailabilityTimestamps(values, shouldPublish);
  const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
    title: values.title,
    description: values.description,
    durationMinutes: values.durationMinutes,
    maxScore: values.maxScore,
    pdfs,
    published: shouldPublish,
    scheduledAt: availability.scheduledAt,
    publishedAt: availability.publishedAt,
    expiresAt: availability.expiresAt,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!shouldPublish && existing.published) {
    update.scheduledAt = null;
    update.publishedAt = null;
    update.expiresAt = null;
  }

  await ref.update(update);

  await Promise.all(existing.pdfs.filter((pdf) => removedPdfIdSet.has(pdf.id)).map((pdf) => deleteStorageFile(pdf.path)));

  const updated = await ref.get();
  const quiz = toQuiz(updated.id, updated.data() ?? {});

  if (quiz.published && (!wasPublished || previousScheduledAt !== quiz.scheduledAt)) {
    await notifyQuizScheduled(quiz);
  }

  return quiz;
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
  const attempts = await getFirebaseAdminDb()
    .collection(quizAttemptsCollection)
    .where("quizId", "==", id)
    .get();

  await Promise.all(
    submissions.docs.map(async (doc) => {
      const submission = toQuizSubmission(doc.id, doc.data());
      await doc.ref.delete();
      await deleteStorageFile(submission.pdfPath);
      await deleteStorageFile(submission.correctedPdfPath);
    }),
  );
  await Promise.all(attempts.docs.map((doc) => doc.ref.delete()));

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

export async function listStudentQuizSubmissions(studentId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(quizSubmissionsCollection)
    .where("studentId", "==", studentId)
    .get();

  return snapshot.docs.map((documentSnapshot) => toQuizSubmission(documentSnapshot.id, documentSnapshot.data()));
}

export async function getStudentQuizAttempt(quizId: string, studentId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(quizAttemptsCollection)
    .doc(getSubmissionDocumentId(quizId, studentId))
    .get();

  if (!snapshot.exists) return null;

  return toQuizAttempt(snapshot.id, snapshot.data() ?? {});
}

export async function listStudentQuizAttempts(studentId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(quizAttemptsCollection)
    .where("studentId", "==", studentId)
    .get();

  return snapshot.docs.map((documentSnapshot) => toQuizAttempt(documentSnapshot.id, documentSnapshot.data()));
}

export async function startQuiz(quizId: string, studentId: string, studentName: string) {
  const quiz = await getQuizById(quizId, { publishedOnly: true });

  if (!quiz) {
    throw new Error("Quiz was not found.");
  }

  if (quiz.status !== "active") {
    throw new Error(quiz.status === "scheduled" ? "This quiz is not available yet." : "This quiz is closed.");
  }

  const existingSubmission = await getStudentQuizSubmission(quizId, studentId);

  if (existingSubmission) {
    throw new Error("This quiz already has a final submission record.");
  }

  const ref = getFirebaseAdminDb().collection(quizAttemptsCollection).doc(getSubmissionDocumentId(quizId, studentId));
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
  const attemptSnapshot = await ref.get();

  return {
    quiz,
    attempt: toQuizAttempt(attemptSnapshot.id, attemptSnapshot.data() ?? {}),
    serverNow: getServerNowIso(),
  };
}

export async function markQuizNoSubmission(quizId: string, studentId: string, studentName: string) {
  const quiz = await getQuizById(quizId, { publishedOnly: true });

  if (!quiz) {
    throw new Error("Quiz was not found.");
  }

  const attempt = await getStudentQuizAttempt(quizId, studentId);

  if (!attempt) {
    throw new Error("Open the quiz before it can be marked as no solution.");
  }

  const ref = getFirebaseAdminDb()
    .collection(quizSubmissionsCollection)
    .doc(getSubmissionDocumentId(quizId, studentId));
  const existing = await ref.get();

  if (existing.exists) {
    return toQuizSubmission(existing.id, existing.data() ?? {});
  }

  await ref.set({
    quizId,
    studentId,
    studentName,
    noSubmission: true,
    pdfPath: "",
    pdfFileName: "",
    submittedAt: null,
    late: false,
    lateBySeconds: 0,
    cheatedAt: FieldValue.serverTimestamp(),
    status: "cheating",
    finalized: true,
    graded: false,
    gradedAt: null,
    gradedBy: "",
    score: 0,
    maxScore: quiz.maxScore,
    feedback: "Cheating.",
    feedbackReturned: false,
    feedbackReturnedAt: null,
    correctedPdfPath: "",
    correctedPdfFileName: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const saved = await ref.get();

  return toQuizSubmission(saved.id, saved.data() ?? {});
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

  const attempt = await getStudentQuizAttempt(quizId, studentId);

  if (!attempt) {
    throw new Error(
      quiz.status === "closed"
        ? "This quiz is closed and cannot be opened."
        : quiz.status === "scheduled"
          ? "This quiz is not available yet."
        : "Open the quiz before submitting your answer.",
    );
  }

  const deadline = getTimestamp(quiz.expiresAt);
  const submittedAt = Timestamp.now();
  const lateBySeconds = deadline
    ? Math.max(0, Math.floor((submittedAt.toMillis() - deadline.toMillis()) / 1000))
    : 0;
  const late = lateBySeconds > 0;
  const ref = getFirebaseAdminDb()
    .collection(quizSubmissionsCollection)
    .doc(getSubmissionDocumentId(quizId, studentId));
  const existing = await ref.get();
  const existingSubmission = existing.exists ? toQuizSubmission(existing.id, existing.data() ?? {}) : null;

  if (existingSubmission) {
    throw new Error(
      existingSubmission.noSubmission
        ? "You violated the quiz rule, this quiz was marked as no solution (cheating) and cannot be submitted again."
        : "This quiz already has a submitted solution.",
    );
  }

  const pdf = await uploadPdf(pdfFile, quizSubmissionFolder);

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
      cheatedAt: null,
      status: late ? "late" : "submitted",
      finalized: true,
      graded: false,
      gradedAt: null,
      gradedBy: "",
      score: null,
      maxScore: quiz.maxScore,
      feedback: "",
      feedbackReturned: false,
      feedbackReturnedAt: null,
      correctedPdfPath: "",
      correctedPdfFileName: "",
      createdAt: existing.exists ? existing.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

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

  const submissions = await hydrateSubmissionStudentNames(snapshot.docs
    .map((documentSnapshot) => toQuizSubmission(documentSnapshot.id, documentSnapshot.data()))
    .sort((a, b) => {
      const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return bTime - aTime;
    }));

  if (quiz.status !== "closed") {
    return submissions;
  }

  const submittedStudentIds = new Set(submissions.map((submission) => submission.studentId));
  const quizRelevanceDate = getTimedResourceRelevanceDate(quiz);
  const missingRows = (await listStudentProfiles())
    .filter((student) => !submittedStudentIds.has(student.id))
    .filter((student) => isWorkRelevantToStudent(quizRelevanceDate, student.registrationDate))
    .map((student): QuizSubmission => ({
      id: getSubmissionDocumentId(quizId, student.id),
      quizId,
      studentId: student.id,
      studentName: student.fullName,
      noSubmission: true,
      pdfPath: "",
      pdfFileName: "",
      submittedAt: null,
      late: false,
      lateBySeconds: 0,
      cheatedAt: null,
      status: "submitted",
      finalized: false,
      graded: false,
      gradedAt: null,
      gradedBy: "",
      score: null,
      maxScore: quiz.maxScore,
      feedback: "",
      feedbackReturned: false,
      feedbackReturnedAt: null,
      correctedPdfPath: "",
      correctedPdfFileName: "",
      createdAt: null,
      updatedAt: null,
    }));

  return [...submissions, ...missingRows];
}

export async function gradeQuizSubmission(
  quizId: string,
  submissionId: string,
  values: QuizGradeValues,
  adminId: string,
  correctedPdfFile?: File | null,
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

  const wasFeedbackReturned = snapshot.data()?.feedbackReturned === true;
  const score = typeof values.score === "number" ? values.score : null;
  const maxScore = quiz.maxScore;

  if (score !== null && score > maxScore) {
    throw new Error("Score cannot be greater than the total score.");
  }

  const shouldReturnFeedback = values.returnFeedback === true;
  const existingSubmission = toQuizSubmission(snapshot.id, snapshot.data() ?? {});
  const correctedPdf = correctedPdfFile ? await uploadPdf(correctedPdfFile, quizSubmissionFolder) : null;
  await ref.update({
    score,
    maxScore,
    feedback: values.feedback ?? "",
    status: "graded",
    graded: true,
    gradedAt: FieldValue.serverTimestamp(),
    gradedBy: adminId,
    ...(shouldReturnFeedback && !wasFeedbackReturned
      ? {
          feedbackReturned: true,
          feedbackReturnedAt: FieldValue.serverTimestamp(),
        }
      : {}),
    ...(correctedPdf
      ? {
          correctedPdfPath: correctedPdf.path,
          correctedPdfFileName: correctedPdf.fileName,
        }
      : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (correctedPdf && existingSubmission.correctedPdfPath) {
    await deleteStorageFile(existingSubmission.correctedPdfPath);
  }

  const updated = await ref.get();

  const [submission] = await hydrateSubmissionStudentNames([
    toQuizSubmission(updated.id, updated.data() ?? {}),
  ]);

  if (shouldReturnFeedback && !wasFeedbackReturned) {
    await createNotification({
      studentId: submission.studentId,
      type: "quiz_feedback",
      title: "Quiz feedback returned",
      message: `Your feedback for ${quiz.title} has been returned. Check it out.`,
      link: `/quizzes/${quiz.id}`,
      relatedId: `${submission.id}_feedbackReturned`,
    });
  }

  return submission;
}

async function notifyQuizScheduled(quiz: Quiz) {
  await replaceNotificationForAllActiveStudents({
    type: "quiz_scheduled",
    title: `Upcoming quiz: ${quiz.title}`,
    message: `${quiz.title} is scheduled for ${formatSchedule(quiz.publishedAt)}. Be ready!`,
    link: `/quizzes/${quiz.id}`,
    relatedId: quiz.id,
  });
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

export async function getReturnedQuizFeedbackPdfBuffer(quizId: string, studentId: string) {
  const submission = await getStudentQuizSubmission(quizId, studentId);

  if (!submission?.feedbackReturned || !submission.correctedPdfPath) {
    return null;
  }

  const [buffer] = await getFirebaseAdminStorageBucket().file(submission.correctedPdfPath).download();

  return { buffer, fileName: submission.correctedPdfFileName || "Corrected quiz.pdf" };
}
