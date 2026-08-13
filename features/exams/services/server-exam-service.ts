import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb, getFirebaseAdminStorageBucket } from "@/lib/firebase/admin";

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

function getStatus(published: boolean, expiresAt: string | null): ExamStatus {
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
    publishedAt: normalizeTimestamp(data.publishedAt),
    expiresAt,
    status: getStatus(published, expiresAt),
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function toExamSubmission(id: string, data: FirebaseFirestore.DocumentData): ExamSubmission {
  const status = data.status === "graded" ? "graded" : data.late === true ? "late" : "submitted";
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
    status,
    finalized: data.finalized !== false,
    graded: data.graded === true || status === "graded",
    gradedAt: normalizeTimestamp(data.gradedAt),
    gradedBy: typeof data.gradedBy === "string" ? data.gradedBy : "",
    score: typeof data.score === "number" ? data.score : null,
    maxScore: typeof data.maxScore === "number" && data.maxScore > 0 ? data.maxScore : 100,
    feedback: typeof data.feedback === "string" ? data.feedback : "",
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
  const publishedAt = shouldPublish ? Timestamp.now() : null;
  const expiresAt = publishedAt
    ? Timestamp.fromMillis(publishedAt.toMillis() + values.durationMinutes * 60 * 1000)
    : null;
  const record = {
    title: values.title,
    description: values.description,
    durationMinutes: values.durationMinutes,
    maxScore: values.maxScore,
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

  return toExam(snapshot.id, snapshot.data() ?? record);
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

  if (existing.published || existing.status === "closed") {
    throw new Error("Published exams cannot be edited.");
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
  const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
    title: values.title,
    description: values.description,
    durationMinutes: values.durationMinutes,
    maxScore: values.maxScore,
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

  return toExam(updated.id, updated.data() ?? {});
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
    throw new Error("This exam is closed.");
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
    status: "graded",
    finalized: true,
    graded: true,
    gradedAt: FieldValue.serverTimestamp(),
    gradedBy: "system",
    score: 0,
    maxScore: exam.maxScore,
    feedback: "No solution (cheating).",
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
      status: late ? "late" : "submitted",
      finalized: true,
      graded: false,
      gradedAt: null,
      gradedBy: "",
      score: null,
      maxScore: exam.maxScore,
      feedback: "",
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
      status: "submitted",
      finalized: false,
      graded: false,
      gradedAt: null,
      gradedBy: "",
      score: null,
      maxScore: exam.maxScore,
      feedback: "",
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

  const score = typeof values.score === "number" ? values.score : null;
  const maxScore = exam.maxScore;

  if (score !== null && score > maxScore) {
    throw new Error("Score cannot be greater than the total score.");
  }

  await ref.update({
    score,
    maxScore,
    feedback: values.feedback ?? "",
    status: "graded",
    graded: true,
    gradedAt: FieldValue.serverTimestamp(),
    gradedBy: adminId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await ref.get();

  const [submission] = await hydrateSubmissionStudentNames([
    toExamSubmission(updated.id, updated.data() ?? {}),
  ]);

  return submission;
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
