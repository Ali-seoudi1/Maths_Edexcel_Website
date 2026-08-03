import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb, getFirebaseAdminStorageBucket } from "@/lib/firebase/admin";

import type { Assignment, AssignmentFormValues, AssignmentGradeValues, AssignmentSubmission } from "../types";

export const assignmentsCollection = "assignments";
export const assignmentSubmissionsCollection = "assignmentSubmissions";
export const assignmentPdfFolder = "assignment-pdfs";
export const assignmentSubmissionFolder = "assignment-solutions";

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

function normalizeDeadline(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
}

function getSubmissionDocumentId(assignmentId: string, studentId: string) {
  return `${assignmentId}_${studentId}`;
}

function isLateSubmission(deadline: string | null, submittedAt: string | null) {
  if (!deadline || !submittedAt) {
    return false;
  }

  return new Date(submittedAt).getTime() > new Date(deadline).getTime();
}

function toAssignment(id: string, data: FirebaseFirestore.DocumentData): Assignment {
  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    deadline: normalizeDeadline(data.deadline),
    pdfUrl: typeof data.pdfUrl === "string" ? data.pdfUrl : "",
    pdfFileName: typeof data.pdfFileName === "string" ? data.pdfFileName : "",
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function toAssignmentSubmission(
  id: string,
  data: FirebaseFirestore.DocumentData,
  assignmentDeadline?: string | null,
): AssignmentSubmission {
  const submittedAt = normalizeTimestamp(data.submittedAt);

  return {
    id,
    assignmentId: typeof data.assignmentId === "string" ? data.assignmentId : "",
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    studentName: typeof data.studentName === "string" ? data.studentName : "Student",
    submittedAt,
    pdfUrl: typeof data.pdfUrl === "string" ? data.pdfUrl : "",
    pdfFileName: typeof data.pdfFileName === "string" ? data.pdfFileName : "",
    grade: typeof data.grade === "number" ? data.grade : null,
    feedback: typeof data.feedback === "string" ? data.feedback : "",
    isLate: isLateSubmission(assignmentDeadline ?? null, submittedAt),
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function sortByDeadline<T extends { deadline: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aValue = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
    const bValue = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;

    return aValue - bValue;
  });
}

function getSafeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function uploadAssignmentPdf(file: File) {
  if (file.type !== "application/pdf") {
    throw new Error("Upload a PDF file.");
  }

  const path = `${assignmentPdfFolder}/${crypto.randomUUID()}-${getSafeFileName(file.name)}`;
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

async function uploadAssignmentSolution(file: File) {
  if (file.type !== "application/pdf") {
    throw new Error("Upload a PDF file.");
  }

  const path = `${assignmentSubmissionFolder}/${crypto.randomUUID()}-${getSafeFileName(file.name)}`;
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

export async function listAssignments() {
  const snapshot = await getFirebaseAdminDb().collection(assignmentsCollection).get();

  return sortByDeadline(
    snapshot.docs.map((documentSnapshot) => toAssignment(documentSnapshot.id, documentSnapshot.data())),
  );
}

export async function getAssignmentById(id: string) {
  const snapshot = await getFirebaseAdminDb().collection(assignmentsCollection).doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  return toAssignment(snapshot.id, snapshot.data() ?? {});
}

export async function createAssignment(values: AssignmentFormValues, pdfFile: File, adminId: string) {
  const pdf = await uploadAssignmentPdf(pdfFile);
  const ref = getFirebaseAdminDb().collection(assignmentsCollection).doc();
  const record = {
    ...values,
    deadline: new Date(values.deadline).toISOString(),
    pdfUrl: pdf.path,
    pdfFileName: pdf.fileName,
    createdBy: adminId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record);
  const snapshot = await ref.get();

  return toAssignment(snapshot.id, snapshot.data() ?? record);
}

export async function deleteAssignment(id: string) {
  const ref = getFirebaseAdminDb().collection(assignmentsCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Assignment was not found.");
  }

  const assignment = toAssignment(snapshot.id, snapshot.data() ?? {});
  await ref.delete();
  await deleteStorageFile(assignment.pdfUrl);

  const submissions = await getFirebaseAdminDb()
    .collection(assignmentSubmissionsCollection)
    .where("assignmentId", "==", id)
    .get();

  await Promise.all(
    submissions.docs.map(async (doc) => {
      const data = toAssignmentSubmission(doc.id, doc.data(), assignment.deadline);
      await doc.ref.delete();
      await deleteStorageFile(data.pdfUrl);
    }),
  );

  return { deletedAssignmentId: id };
}

export async function listAssignmentSubmissions(assignmentId: string) {
  const assignment = await getAssignmentById(assignmentId);

  if (!assignment) {
    throw new Error("Assignment was not found.");
  }

  const snapshot = await getFirebaseAdminDb()
    .collection(assignmentSubmissionsCollection)
    .where("assignmentId", "==", assignmentId)
    .get();

  return snapshot.docs
    .map((documentSnapshot) => toAssignmentSubmission(documentSnapshot.id, documentSnapshot.data(), assignment.deadline))
    .sort((a, b) => {
      const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return bTime - aTime;
    });
}

export async function getStudentSubmission(assignmentId: string, studentId: string) {
  const assignment = await getAssignmentById(assignmentId);

  if (!assignment) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection(assignmentSubmissionsCollection)
    .doc(getSubmissionDocumentId(assignmentId, studentId))
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return toAssignmentSubmission(snapshot.id, snapshot.data() ?? {}, assignment.deadline);
}

export async function submitAssignmentSolution(
  assignmentId: string,
  studentId: string,
  studentName: string,
  pdfFile: File,
) {
  const assignment = await getAssignmentById(assignmentId);

  if (!assignment) {
    throw new Error("Assignment was not found.");
  }

  const pdf = await uploadAssignmentSolution(pdfFile);
  const ref = getFirebaseAdminDb()
    .collection(assignmentSubmissionsCollection)
    .doc(getSubmissionDocumentId(assignmentId, studentId));

  const record = {
    assignmentId,
    studentId,
    studentName,
    pdfUrl: pdf.path,
    pdfFileName: pdf.fileName,
    submittedAt: FieldValue.serverTimestamp(),
    grade: null,
    feedback: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record, { merge: true });
  const snapshot = await ref.get();

  return toAssignmentSubmission(snapshot.id, snapshot.data() ?? record, assignment.deadline);
}

export async function updateAssignmentSubmissionGrade(
  assignmentId: string,
  submissionId: string,
  values: AssignmentGradeValues,
) {
  const assignment = await getAssignmentById(assignmentId);

  if (!assignment) {
    throw new Error("Assignment was not found.");
  }

  const ref = getFirebaseAdminDb()
    .collection(assignmentSubmissionsCollection)
    .doc(submissionId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Submission was not found.");
  }

  const grade = values.grade ?? null;
  const feedback = values.feedback ?? "";

  await ref.update({
    grade,
    feedback,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await ref.get();

  return toAssignmentSubmission(updated.id, updated.data() ?? {}, assignment.deadline);
}

export async function getAssignmentPdfBuffer(id: string) {
  const assignment = await getAssignmentById(id);

  if (!assignment) {
    return null;
  }

  const [buffer] = await getFirebaseAdminStorageBucket().file(assignment.pdfUrl).download();

  return { buffer, fileName: assignment.pdfFileName };
}

export async function getSubmissionPdfBuffer(assignmentId: string, studentId: string) {
  const submission = await getStudentSubmission(assignmentId, studentId);

  if (!submission) {
    return null;
  }

  const [buffer] = await getFirebaseAdminStorageBucket().file(submission.pdfUrl).download();

  return { buffer, fileName: submission.pdfFileName };
}
