import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb, getFirebaseAdminStorageBucket } from "@/lib/firebase/admin";
import { createNotification } from "@/features/notifications/services/server-notification-service";

import type {
  Assignment,
  AssignmentFormValues,
  AssignmentGradeValues,
  AssignmentPdf,
  AssignmentSubmission,
} from "../types";

export const assignmentsCollection = "assignments";
export const assignmentSubmissionsCollection = "assignmentSubmissions";
export const assignmentPdfFolder = "assignment-pdfs";
export const assignmentSubmissionFolder = "assignment-solutions";
const maxPdfUploadSizeBytes = 20 * 1024 * 1024;

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

function hasDeadlinePassed(deadline: string | null) {
  return Boolean(deadline && Date.now() > new Date(deadline).getTime());
}

function toAssignment(id: string, data: FirebaseFirestore.DocumentData): Assignment {
  const pdfs = normalizePdfs(data);

  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    deadline: normalizeDeadline(data.deadline),
    maxGrade: typeof data.maxGrade === "number" && data.maxGrade > 0 ? data.maxGrade : 100,
    pdfs,
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
  assignmentMaxGrade?: number,
): AssignmentSubmission {
  const submittedAt = normalizeTimestamp(data.submittedAt);
  const pdfs = normalizePdfs(data);

  return {
    id,
    assignmentId: typeof data.assignmentId === "string" ? data.assignmentId : "",
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    studentName: typeof data.studentName === "string" ? data.studentName : "Student",
    submittedAt,
    pdfs,
    pdfUrl: typeof data.pdfUrl === "string" ? data.pdfUrl : "",
    pdfFileName: typeof data.pdfFileName === "string" ? data.pdfFileName : "",
    grade: typeof data.grade === "number" ? data.grade : null,
    maxGrade:
      typeof assignmentMaxGrade === "number" && assignmentMaxGrade > 0
        ? assignmentMaxGrade
        : typeof data.maxGrade === "number" && data.maxGrade > 0
          ? data.maxGrade
          : 100,
    feedback: typeof data.feedback === "string" ? data.feedback : "",
    isLate: isLateSubmission(assignmentDeadline ?? null, submittedAt),
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function normalizePdfs(data: FirebaseFirestore.DocumentData): AssignmentPdf[] {
  if (Array.isArray(data.pdfs)) {
    return data.pdfs
      .map((pdf, index) => {
        if (typeof pdf !== "object" || !pdf) {
          return null;
        }

        const path = "path" in pdf && typeof pdf.path === "string" ? pdf.path : "";
        const fileName = "fileName" in pdf && typeof pdf.fileName === "string" ? pdf.fileName : "";
        const id = "id" in pdf && typeof pdf.id === "string" ? pdf.id : `pdf-${index + 1}`;

        if (!path || !fileName) {
          return null;
        }

        return { id, path, fileName };
      })
      .filter((pdf): pdf is AssignmentPdf => Boolean(pdf));
  }

  if (typeof data.pdfUrl === "string" && typeof data.pdfFileName === "string") {
    return [{ id: "primary", path: data.pdfUrl, fileName: data.pdfFileName }];
  }

  return [];
}

function sortByCreatedAt<T extends { createdAt: string | null; deadline: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aValue = a.createdAt
      ? new Date(a.createdAt).getTime()
      : a.deadline
        ? new Date(a.deadline).getTime()
        : 0;
    const bValue = b.createdAt
      ? new Date(b.createdAt).getTime()
      : b.deadline
        ? new Date(b.deadline).getTime()
        : 0;

    return bValue - aValue;
  });
}

function getSafeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function uploadAssignmentPdf(file: File): Promise<AssignmentPdf> {
  if (file.type !== "application/pdf") {
    throw new Error("Upload a PDF file.");
  }

  if (file.size > maxPdfUploadSizeBytes) {
    throw new Error("Upload a PDF smaller than 20 MB.");
  }

  const id = crypto.randomUUID();
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

  return { id, path, fileName: file.name };
}

async function uploadAssignmentSolution(file: File): Promise<AssignmentPdf> {
  if (file.type !== "application/pdf") {
    throw new Error("Upload a PDF file.");
  }

  if (file.size > maxPdfUploadSizeBytes) {
    throw new Error("Upload a PDF smaller than 20 MB.");
  }

  const id = crypto.randomUUID();
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

  return { id, path, fileName: file.name };
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

async function getStudentDisplayName(studentId: string, fallback: string) {
  const snapshot = await getFirebaseAdminDb().collection("users").doc(studentId).get();
  const data = snapshot.data();

  return typeof data?.fullName === "string" && data.fullName.trim() ? data.fullName : fallback;
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

export async function listAssignments() {
  const snapshot = await getFirebaseAdminDb().collection(assignmentsCollection).get();

  return sortByCreatedAt(
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

export async function createAssignment(values: AssignmentFormValues, pdfFiles: File[], adminId: string) {
  const pdfs = await Promise.all(pdfFiles.map((pdfFile) => uploadAssignmentPdf(pdfFile)));
  const primaryPdf = pdfs[0];
  const ref = getFirebaseAdminDb().collection(assignmentsCollection).doc();
  const record = {
    ...values,
    deadline: new Date(values.deadline).toISOString(),
    pdfs,
    pdfUrl: primaryPdf?.path ?? "",
    pdfFileName: primaryPdf?.fileName ?? "",
    createdBy: adminId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record);
  const snapshot = await ref.get();

  return toAssignment(snapshot.id, snapshot.data() ?? record);
}

export async function updateAssignment(
  id: string,
  values: AssignmentFormValues,
  pdfFiles: File[],
  adminId: string,
) {
  const ref = getFirebaseAdminDb().collection(assignmentsCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Assignment was not found.");
  }

  const existingAssignment = toAssignment(snapshot.id, snapshot.data() ?? {});
  const uploadedPdfs = await Promise.all(pdfFiles.map((pdfFile) => uploadAssignmentPdf(pdfFile)));
  const nextPdfs = [...existingAssignment.pdfs, ...uploadedPdfs];
  const primaryPdf = nextPdfs[0];

  if (!values.description.trim() && nextPdfs.length === 0) {
    throw new Error("Add a description, upload at least one PDF, or both.");
  }

  await ref.update({
    ...values,
    deadline: new Date(values.deadline).toISOString(),
    pdfs: nextPdfs,
    pdfUrl: primaryPdf?.path ?? "",
    pdfFileName: primaryPdf?.fileName ?? "",
    updatedBy: adminId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await ref.get();

  return toAssignment(updated.id, updated.data() ?? {});
}

export async function deleteAssignment(id: string) {
  const ref = getFirebaseAdminDb().collection(assignmentsCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Assignment was not found.");
  }

  const assignment = toAssignment(snapshot.id, snapshot.data() ?? {});
  await ref.delete();
  await Promise.all(assignment.pdfs.map((pdf) => deleteStorageFile(pdf.path)));

  const submissions = await getFirebaseAdminDb()
    .collection(assignmentSubmissionsCollection)
    .where("assignmentId", "==", id)
    .get();

  await Promise.all(
    submissions.docs.map(async (doc) => {
      const data = toAssignmentSubmission(doc.id, doc.data(), assignment.deadline, assignment.maxGrade);
      await doc.ref.delete();
      await Promise.all(data.pdfs.map((pdf) => deleteStorageFile(pdf.path)));
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

  const submissions = snapshot.docs
    .map((documentSnapshot) =>
      toAssignmentSubmission(documentSnapshot.id, documentSnapshot.data(), assignment.deadline, assignment.maxGrade),
    )
    .sort((a, b) => {
      const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return bTime - aTime;
    });

  if (!hasDeadlinePassed(assignment.deadline)) {
    return submissions;
  }

  const submittedStudentIds = new Set(submissions.map((submission) => submission.studentId));
  const missingRows = (await listStudentProfiles())
    .filter((student) => !submittedStudentIds.has(student.id))
    .map((student): AssignmentSubmission => ({
      id: getSubmissionDocumentId(assignmentId, student.id),
      assignmentId,
      studentId: student.id,
      studentName: student.fullName,
      noSubmission: true,
      submittedAt: null,
      pdfs: [],
      pdfUrl: "",
      pdfFileName: "",
      grade: null,
      maxGrade: assignment.maxGrade,
      feedback: "",
      isLate: false,
      createdAt: null,
      updatedAt: null,
    }));

  return [...submissions, ...missingRows];
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

  return toAssignmentSubmission(snapshot.id, snapshot.data() ?? {}, assignment.deadline, assignment.maxGrade);
}

export async function listStudentAssignmentSubmissions(
  studentId: string,
  assignmentList?: Assignment[],
) {
  const [assignments, snapshot] = await Promise.all([
    assignmentList ? Promise.resolve(assignmentList) : listAssignments(),
    getFirebaseAdminDb()
      .collection(assignmentSubmissionsCollection)
      .where("studentId", "==", studentId)
      .get(),
  ]);
  const assignmentMap = new Map(assignments.map((assignment) => [assignment.id, assignment]));

  return snapshot.docs.map((documentSnapshot) => {
    const assignmentId = String(documentSnapshot.data().assignmentId ?? "");
    const assignment = assignmentMap.get(assignmentId);

    return {
      assignment,
      submission: toAssignmentSubmission(
        documentSnapshot.id,
        documentSnapshot.data(),
        assignment?.deadline ?? null,
        assignment?.maxGrade,
      ),
    };
  });
}

export async function deleteStudentSubmission(assignmentId: string, studentId: string) {
  const assignment = await getAssignmentById(assignmentId);

  if (!assignment) {
    throw new Error("Assignment was not found.");
  }

  const ref = getFirebaseAdminDb()
    .collection(assignmentSubmissionsCollection)
    .doc(getSubmissionDocumentId(assignmentId, studentId));
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Submission was not found.");
  }

  const submission = toAssignmentSubmission(snapshot.id, snapshot.data() ?? {}, assignment.deadline, assignment.maxGrade);

  if (typeof submission.grade === "number") {
    throw new Error("This assignment has already been graded.");
  }

  await ref.delete();
  await Promise.all(submission.pdfs.map((pdf) => deleteStorageFile(pdf.path)));

  return { deletedSubmissionId: snapshot.id };
}

export async function deleteStudentSubmissionPdf(
  assignmentId: string,
  studentId: string,
  pdfId: string,
) {
  const assignment = await getAssignmentById(assignmentId);

  if (!assignment) {
    throw new Error("Assignment was not found.");
  }

  const ref = getFirebaseAdminDb()
    .collection(assignmentSubmissionsCollection)
    .doc(getSubmissionDocumentId(assignmentId, studentId));
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Submission was not found.");
  }

  const submission = toAssignmentSubmission(snapshot.id, snapshot.data() ?? {}, assignment.deadline, assignment.maxGrade);

  if (typeof submission.grade === "number") {
    throw new Error("This assignment has already been graded.");
  }

  const pdfToDelete = submission.pdfs.find((pdf) => pdf.id === pdfId);

  if (!pdfToDelete) {
    throw new Error("Submission PDF was not found.");
  }

  const nextPdfs = submission.pdfs.filter((pdf) => pdf.id !== pdfId);
  await deleteStorageFile(pdfToDelete.path);

  if (nextPdfs.length === 0) {
    await ref.delete();
    return { submission: null };
  }

  const primaryPdf = nextPdfs[0];
  await ref.update({
    pdfs: nextPdfs,
    pdfUrl: primaryPdf.path,
    pdfFileName: primaryPdf.fileName,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await ref.get();

  return {
    submission: toAssignmentSubmission(updated.id, updated.data() ?? {}, assignment.deadline, assignment.maxGrade),
  };
}

export async function submitAssignmentSolution(
  assignmentId: string,
  studentId: string,
  studentName: string,
  pdfFiles: File[],
) {
  const assignment = await getAssignmentById(assignmentId);

  if (!assignment) {
    throw new Error("Assignment was not found.");
  }

  const displayName = await getStudentDisplayName(studentId, studentName);
  const ref = getFirebaseAdminDb()
    .collection(assignmentSubmissionsCollection)
    .doc(getSubmissionDocumentId(assignmentId, studentId));
  const existingSnapshot = await ref.get();
  const existingSubmission = existingSnapshot.exists
    ? toAssignmentSubmission(existingSnapshot.id, existingSnapshot.data() ?? {}, assignment.deadline, assignment.maxGrade)
    : null;

  if (typeof existingSubmission?.grade === "number") {
    throw new Error("This assignment has already been graded.");
  }

  const uploadedPdfs = await Promise.all(pdfFiles.map((pdfFile) => uploadAssignmentSolution(pdfFile)));
  const pdfs = [...(existingSubmission?.pdfs ?? []), ...uploadedPdfs];
  const primaryPdf = pdfs[0];

  const record = {
    assignmentId,
    studentId,
    studentName: displayName,
    pdfs,
    pdfUrl: primaryPdf?.path ?? "",
    pdfFileName: primaryPdf?.fileName ?? "",
    submittedAt: FieldValue.serverTimestamp(),
    grade: null,
    feedback: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record, { merge: true });
  const snapshot = await ref.get();

  return toAssignmentSubmission(snapshot.id, snapshot.data() ?? record, assignment.deadline, assignment.maxGrade);
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

  const wasGraded = typeof snapshot.data()?.grade === "number";
  const grade = values.grade ?? null;
  const maxGrade = assignment.maxGrade;
  const feedback = values.feedback ?? "";

  if (grade !== null && grade > maxGrade) {
    throw new Error("Grade cannot be greater than the total score.");
  }

  await ref.update({
    grade,
    maxGrade,
    feedback,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updated = await ref.get();
  const submission = toAssignmentSubmission(updated.id, updated.data() ?? {}, assignment.deadline, assignment.maxGrade);

  if (!wasGraded && grade !== null) {
    await createNotification({
      studentId: submission.studentId,
      type: "assignment_grade",
      title: "Your assignment grade is available",
      message: `Your grade for ${assignment.title} is now available. Check it out.`,
      link: "/assignments",
      relatedId: submission.id,
    });
  }

  return submission;
}

export async function getAssignmentPdfBuffer(id: string, pdfId?: string) {
  const assignment = await getAssignmentById(id);

  if (!assignment) {
    return null;
  }

  const pdf = assignment.pdfs.find((item) => item.id === pdfId) ?? assignment.pdfs[0];

  if (!pdf) {
    return null;
  }

  const [buffer] = await getFirebaseAdminStorageBucket().file(pdf.path).download();

  return { buffer, fileName: pdf.fileName };
}

export async function getSubmissionPdfBuffer(assignmentId: string, studentId: string, pdfId?: string) {
  const submission = await getStudentSubmission(assignmentId, studentId);

  if (!submission) {
    return null;
  }

  const pdf = submission.pdfs.find((item) => item.id === pdfId) ?? submission.pdfs[0];

  if (!pdf) {
    return null;
  }

  const [buffer] = await getFirebaseAdminStorageBucket().file(pdf.path).download();

  return { buffer, fileName: pdf.fileName };
}

export async function getSubmissionPdfBufferForAdmin(
  assignmentId: string,
  submissionId: string,
  pdfId?: string,
) {
  const assignment = await getAssignmentById(assignmentId);

  if (!assignment) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection(assignmentSubmissionsCollection)
    .doc(submissionId)
    .get();

  if (!snapshot.exists || snapshot.data()?.assignmentId !== assignmentId) {
    return null;
  }

  const submission = toAssignmentSubmission(snapshot.id, snapshot.data() ?? {}, assignment.deadline, assignment.maxGrade);
  const pdf = submission.pdfs.find((item) => item.id === pdfId) ?? submission.pdfs[0];

  if (!pdf) {
    return null;
  }

  const [buffer] = await getFirebaseAdminStorageBucket().file(pdf.path).download();

  return { buffer, fileName: pdf.fileName };
}
