import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb, getFirebaseAdminStorageBucket } from "@/lib/firebase/admin";
import {
  createNotification,
  replaceNotificationForAllActiveStudents,
} from "@/features/notifications/services/server-notification-service";

import type {
  Exam,
  ExamAttempt,
  ExamFormValues,
  ExamGradeValues,
  ExamStatus,
  ExamSubmission,
} from "../types";

export const examsCollection = "exams";
export const examSubmissionsCollection = "examSubmissions";
export const examAttemptsCollection = "examAttempts";
export const examPdfFolder = "exam-pdfs";
export const examSubmissionFolder = "exam-submissions";

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

function getStatus(published: boolean, scheduledAt: string | null, expiresAt: string | null): ExamStatus {
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

function getAvailabilityTimestamps(values: ExamFormValues, shouldPublish: boolean) {
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
    // Missing storage objects should not block exam cleanup.
  }
}

function toExam(id: string, data: FirebaseFirestore.DocumentData): Exam {
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
      : [{ id: "legacy-primary-pdf", path: legacyPdfPath, fileName: legacyPdfFileName || "Exam.pdf" }];

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

function toExamSubmission(id: string, data: FirebaseFirestore.DocumentData): ExamSubmission {
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
    examId: typeof data.examId === "string" ? data.examId : "",
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

function toExamAttempt(id: string, data: FirebaseFirestore.DocumentData): ExamAttempt {
  return {
    id,
    examId: typeof data.examId === "string" ? data.examId : "",
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    studentName: typeof data.studentName === "string" ? data.studentName : "Student",
    openedAt: normalizeTimestamp(data.openedAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

async function hydrateSubmissionStudentNames(submissions: ExamSubmission[]) {
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
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

function getSubmissionDocumentId(examId: string, studentId: string) {
  return `${examId}_${studentId}`;
}

function sortExams(exams: Exam[]) {
  return exams.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function getServerNowIso() {
  return Timestamp.now().toDate().toISOString();
}

export async function listExams(options: { publishedOnly?: boolean } = {}) {
  let query: FirebaseFirestore.Query = getFirebaseAdminDb().collection(examsCollection);

  if (options.publishedOnly) {
    query = query.where("published", "==", true);
  }

  const snapshot = await query.get();

  return sortExams(snapshot.docs.map((documentSnapshot) => toExam(documentSnapshot.id, documentSnapshot.data())));
}

export async function getExamById(id: string, options: { publishedOnly?: boolean } = {}) {
  const snapshot = await getFirebaseAdminDb().collection(examsCollection).doc(id).get();

  if (!snapshot.exists) return null;

  const exam = toExam(snapshot.id, snapshot.data() ?? {});

  if (options.publishedOnly && !exam.published) return null;

  return exam;
}

export async function createExam(values: ExamFormValues, pdfFiles: File[], adminId: string) {
  if (pdfFiles.length === 0) {
    throw new Error("Upload at least one exam PDF.");
  }

  const pdfs = await Promise.all(pdfFiles.map((file) => uploadPdf(file, examPdfFolder)));
  const ref = getFirebaseAdminDb().collection(examsCollection).doc();
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
  const exam = toExam(snapshot.id, snapshot.data() ?? record);

  if (exam.published) {
    await notifyExamScheduled(exam);
  }

  return exam;
}

export async function updateExam(
  id: string,
  values: ExamFormValues,
  pdfFiles: File[],
  removedPdfIds: string[],
) {
  const ref = getFirebaseAdminDb().collection(examsCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Exam was not found.");
  }

  const existing = toExam(snapshot.id, snapshot.data() ?? {});

  if (existing.status === "active" || existing.status === "closed") {
    throw new Error("Active or closed exams cannot be edited.");
  }

  const nextPdfs = await Promise.all(pdfFiles.map((file) => uploadPdf(file, examPdfFolder)));
  const removedPdfIdSet = new Set(removedPdfIds);
  const retainedPdfs = existing.pdfs.filter((pdf) => !removedPdfIdSet.has(pdf.id));
  const pdfs = [...retainedPdfs, ...nextPdfs];

  if (pdfs.length === 0) {
    await Promise.all(nextPdfs.map((pdf) => deleteStorageFile(pdf.path)));
    throw new Error("A exam must have at least one PDF.");
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
  const exam = toExam(updated.id, updated.data() ?? {});

  if (exam.published && (!wasPublished || previousScheduledAt !== exam.scheduledAt)) {
    await notifyExamScheduled(exam);
  }

  return exam;
}

export async function deleteExam(id: string) {
  const ref = getFirebaseAdminDb().collection(examsCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Exam was not found.");
  }

  const exam = toExam(snapshot.id, snapshot.data() ?? {});
  await ref.delete();
  await Promise.all(exam.pdfs.map((pdf) => deleteStorageFile(pdf.path)));

  const submissions = await getFirebaseAdminDb()
    .collection(examSubmissionsCollection)
    .where("examId", "==", id)
    .get();
  const attempts = await getFirebaseAdminDb()
    .collection(examAttemptsCollection)
    .where("examId", "==", id)
    .get();

  await Promise.all(
    submissions.docs.map(async (doc) => {
      const submission = toExamSubmission(doc.id, doc.data());
      await doc.ref.delete();
      await deleteStorageFile(submission.pdfPath);
      await deleteStorageFile(submission.correctedPdfPath);
    }),
  );
  await Promise.all(attempts.docs.map((doc) => doc.ref.delete()));

  return { deletedExamId: id };
}

export async function getStudentExamSubmission(examId: string, studentId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(examSubmissionsCollection)
    .doc(getSubmissionDocumentId(examId, studentId))
    .get();

  if (!snapshot.exists) return null;

  return toExamSubmission(snapshot.id, snapshot.data() ?? {});
}

export async function listStudentExamSubmissions(studentId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(examSubmissionsCollection)
    .where("studentId", "==", studentId)
    .get();

  return snapshot.docs.map((documentSnapshot) => toExamSubmission(documentSnapshot.id, documentSnapshot.data()));
}

export async function getStudentExamAttempt(examId: string, studentId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(examAttemptsCollection)
    .doc(getSubmissionDocumentId(examId, studentId))
    .get();

  if (!snapshot.exists) return null;

  return toExamAttempt(snapshot.id, snapshot.data() ?? {});
}

export async function listStudentExamAttempts(studentId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(examAttemptsCollection)
    .where("studentId", "==", studentId)
    .get();

  return snapshot.docs.map((documentSnapshot) => toExamAttempt(documentSnapshot.id, documentSnapshot.data()));
}

export async function startExam(examId: string, studentId: string, studentName: string) {
  const exam = await getExamById(examId, { publishedOnly: true });

  if (!exam) {
    throw new Error("Exam was not found.");
  }

  if (exam.status !== "active") {
    throw new Error(exam.status === "scheduled" ? "This exam is not available yet." : "This exam is closed.");
  }

  const existingSubmission = await getStudentExamSubmission(examId, studentId);

  if (existingSubmission) {
    throw new Error("This exam already has a final submission record.");
  }

  const ref = getFirebaseAdminDb().collection(examAttemptsCollection).doc(getSubmissionDocumentId(examId, studentId));
  await ref.set(
    {
      examId,
      studentId,
      studentName,
      openedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  const attemptSnapshot = await ref.get();

  return {
    exam,
    attempt: toExamAttempt(attemptSnapshot.id, attemptSnapshot.data() ?? {}),
    serverNow: getServerNowIso(),
  };
}

export async function markExamNoSubmission(examId: string, studentId: string, studentName: string) {
  const exam = await getExamById(examId, { publishedOnly: true });

  if (!exam) {
    throw new Error("Exam was not found.");
  }

  const attempt = await getStudentExamAttempt(examId, studentId);

  if (!attempt) {
    throw new Error("Open the exam before it can be marked as no solution.");
  }

  const ref = getFirebaseAdminDb()
    .collection(examSubmissionsCollection)
    .doc(getSubmissionDocumentId(examId, studentId));
  const existing = await ref.get();

  if (existing.exists) {
    return toExamSubmission(existing.id, existing.data() ?? {});
  }

  await ref.set({
    examId,
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
    maxScore: exam.maxScore,
    feedback: "Cheating.",
    feedbackReturned: false,
    feedbackReturnedAt: null,
    correctedPdfPath: "",
    correctedPdfFileName: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const saved = await ref.get();

  return toExamSubmission(saved.id, saved.data() ?? {});
}

export async function submitExamPdf(
  examId: string,
  studentId: string,
  studentName: string,
  pdfFile: File,
) {
  const exam = await getExamById(examId, { publishedOnly: true });

  if (!exam) {
    throw new Error("Exam was not found.");
  }

  const attempt = await getStudentExamAttempt(examId, studentId);

  if (!attempt) {
    throw new Error(
      exam.status === "closed"
        ? "This exam is closed and cannot be opened."
        : exam.status === "scheduled"
          ? "This exam is not available yet."
        : "Open the exam before submitting your answer.",
    );
  }

  const deadline = getTimestamp(exam.expiresAt);
  const submittedAt = Timestamp.now();
  const lateBySeconds = deadline
    ? Math.max(0, Math.floor((submittedAt.toMillis() - deadline.toMillis()) / 1000))
    : 0;
  const late = lateBySeconds > 0;
  const ref = getFirebaseAdminDb()
    .collection(examSubmissionsCollection)
    .doc(getSubmissionDocumentId(examId, studentId));
  const existing = await ref.get();
  const existingSubmission = existing.exists ? toExamSubmission(existing.id, existing.data() ?? {}) : null;

  if (existingSubmission) {
    throw new Error(
      existingSubmission.noSubmission
        ? "You violated the exam rule, this exam was marked as no solution (cheating) and cannot be submitted again."
        : "This exam already has a submitted solution.",
    );
  }

  const pdf = await uploadPdf(pdfFile, examSubmissionFolder);

  await ref.set(
    {
      examId,
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
      maxScore: exam.maxScore,
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

  return toExamSubmission(saved.id, saved.data() ?? {});
}

export async function listExamSubmissions(examId: string) {
  const exam = await getExamById(examId);

  if (!exam) {
    throw new Error("Exam was not found.");
  }

  const snapshot = await getFirebaseAdminDb()
    .collection(examSubmissionsCollection)
    .where("examId", "==", examId)
    .get();

  const submissions = await hydrateSubmissionStudentNames(snapshot.docs
    .map((documentSnapshot) => toExamSubmission(documentSnapshot.id, documentSnapshot.data()))
    .sort((a, b) => {
      const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return bTime - aTime;
    }));

  if (exam.status !== "closed") {
    return submissions;
  }

  const submittedStudentIds = new Set(submissions.map((submission) => submission.studentId));
  const missingRows = (await listStudentProfiles())
    .filter((student) => !submittedStudentIds.has(student.id))
    .map((student): ExamSubmission => ({
      id: getSubmissionDocumentId(examId, student.id),
      examId,
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
      maxScore: exam.maxScore,
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

export async function gradeExamSubmission(
  examId: string,
  submissionId: string,
  values: ExamGradeValues,
  adminId: string,
  correctedPdfFile?: File | null,
) {
  const exam = await getExamById(examId);

  if (!exam) {
    throw new Error("Exam was not found.");
  }

  const ref = getFirebaseAdminDb().collection(examSubmissionsCollection).doc(submissionId);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.examId !== examId) {
    throw new Error("Submission was not found.");
  }

  const wasFeedbackReturned = snapshot.data()?.feedbackReturned === true;
  const score = typeof values.score === "number" ? values.score : null;
  const maxScore = exam.maxScore;

  if (score !== null && score > maxScore) {
    throw new Error("Score cannot be greater than the total score.");
  }

  const shouldReturnFeedback = values.returnFeedback === true;
  const existingSubmission = toExamSubmission(snapshot.id, snapshot.data() ?? {});
  const correctedPdf = correctedPdfFile ? await uploadPdf(correctedPdfFile, examSubmissionFolder) : null;
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
    toExamSubmission(updated.id, updated.data() ?? {}),
  ]);

  if (shouldReturnFeedback && !wasFeedbackReturned) {
    await createNotification({
      studentId: submission.studentId,
      type: "exam_feedback",
      title: "Exam feedback returned",
      message: `Your feedback for ${exam.title} has been returned. Check it out.`,
      link: `/exams/${exam.id}`,
      relatedId: `${submission.id}_feedbackReturned`,
    });
  }

  return submission;
}

async function notifyExamScheduled(exam: Exam) {
  await replaceNotificationForAllActiveStudents({
    type: "exam_scheduled",
    title: `Upcoming exam: ${exam.title}`,
    message: `${exam.title} is scheduled for ${formatSchedule(exam.publishedAt)}. Be ready!`,
    link: `/exams/${exam.id}`,
    relatedId: exam.id,
  });
}

export async function getExamPdfBuffer(id: string, pdfId?: string | null) {
  const exam = await getExamById(id, { publishedOnly: true });

  if (!exam) return null;

  const pdf = (pdfId ? exam.pdfs.find((item) => item.id === pdfId) : exam.pdfs[0]) ?? null;

  if (!pdf) return null;

  const [buffer] = await getFirebaseAdminStorageBucket().file(pdf.path).download();

  return { buffer, fileName: pdf.fileName };
}

export async function getAdminExamPdfBuffer(id: string, pdfId?: string | null) {
  const exam = await getExamById(id);

  if (!exam) return null;

  const pdf = (pdfId ? exam.pdfs.find((item) => item.id === pdfId) : exam.pdfs[0]) ?? null;

  if (!pdf) return null;

  const [buffer] = await getFirebaseAdminStorageBucket().file(pdf.path).download();

  return { buffer, fileName: pdf.fileName };
}

export async function getSubmissionPdfBuffer(examId: string, submissionId: string) {
  const submissionSnapshot = await getFirebaseAdminDb()
    .collection(examSubmissionsCollection)
    .doc(submissionId)
    .get();

  if (!submissionSnapshot.exists || submissionSnapshot.data()?.examId !== examId) {
    return null;
  }

  const submission = toExamSubmission(submissionSnapshot.id, submissionSnapshot.data() ?? {});
  const [buffer] = await getFirebaseAdminStorageBucket().file(submission.pdfPath).download();

  return { buffer, fileName: submission.pdfFileName };
}

export async function getReturnedExamFeedbackPdfBuffer(examId: string, studentId: string) {
  const submission = await getStudentExamSubmission(examId, studentId);

  if (!submission?.feedbackReturned || !submission.correctedPdfPath) {
    return null;
  }

  const [buffer] = await getFirebaseAdminStorageBucket().file(submission.correctedPdfPath).download();

  return { buffer, fileName: submission.correctedPdfFileName || "Corrected exam.pdf" };
}
