import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb, getFirebaseAdminStorageBucket } from "@/lib/firebase/admin";

import type { ChapterFormValues, LessonFormValues } from "../schemas";
import type { Chapter, Lesson } from "../types";

export const chaptersCollection = "chapters";
export const lessonsCollection = "lessons";
export const lessonPdfFolder = "lesson-pdfs";

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

function toChapter(id: string, data: FirebaseFirestore.DocumentData): Chapter {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "",
    description: typeof data.description === "string" ? data.description : "",
    order: typeof data.order === "number" ? data.order : 0,
    published: data.published === true,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function toLesson(id: string, data: FirebaseFirestore.DocumentData, chapterName?: string): Lesson {
  return {
    id,
    chapterId: typeof data.chapterId === "string" ? data.chapterId : "",
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    order: typeof data.order === "number" ? data.order : 0,
    pdfUrl: typeof data.pdfUrl === "string" ? data.pdfUrl : "",
    pdfFileName: typeof data.pdfFileName === "string" ? data.pdfFileName : "",
    published: data.published === true,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
    chapterName,
  };
}

function sortByOrderThenName<T extends { order: number; title?: string; name?: string }>(items: T[]) {
  return items.sort((a, b) => a.order - b.order || (a.name ?? a.title ?? "").localeCompare(b.name ?? b.title ?? ""));
}

export async function listChapters(options: { publishedOnly?: boolean } = {}) {
  let query: FirebaseFirestore.Query = getFirebaseAdminDb().collection(chaptersCollection);

  if (options.publishedOnly) {
    query = query.where("published", "==", true);
  }

  const snapshot = await query.get();

  return sortByOrderThenName(
    snapshot.docs.map((documentSnapshot) => toChapter(documentSnapshot.id, documentSnapshot.data())),
  );
}

export async function getChapterById(id: string) {
  const snapshot = await getFirebaseAdminDb().collection(chaptersCollection).doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  return toChapter(snapshot.id, snapshot.data() ?? {});
}

export async function createChapter(values: ChapterFormValues) {
  const ref = getFirebaseAdminDb().collection(chaptersCollection).doc();
  const record = {
    ...values,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record);
  const snapshot = await ref.get();

  return toChapter(snapshot.id, snapshot.data() ?? record);
}

export async function updateChapter(id: string, values: ChapterFormValues) {
  const ref = getFirebaseAdminDb().collection(chaptersCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Chapter was not found.");
  }

  await ref.update({ ...values, updatedAt: FieldValue.serverTimestamp() });
  const updated = await ref.get();

  return toChapter(updated.id, updated.data() ?? values);
}

export async function deleteChapter(id: string) {
  const db = getFirebaseAdminDb();
  const lessons = await db.collection(lessonsCollection).where("chapterId", "==", id).limit(1).get();

  if (!lessons.empty) {
    throw new Error("Move or delete this chapter's lessons before deleting the chapter.");
  }

  await db.collection(chaptersCollection).doc(id).delete();
  return { deletedChapterId: id };
}

async function getChapterNameMap() {
  const chapters = await listChapters();
  return new Map(chapters.map((chapter) => [chapter.id, chapter.name]));
}

export async function listLessons(options: { publishedOnly?: boolean; chapterId?: string } = {}) {
  let query: FirebaseFirestore.Query = getFirebaseAdminDb().collection(lessonsCollection);

  if (options.publishedOnly) {
    query = query.where("published", "==", true);
  }

  if (options.chapterId) {
    query = query.where("chapterId", "==", options.chapterId);
  }

  const [snapshot, chapterNames] = await Promise.all([query.get(), getChapterNameMap()]);

  return sortByOrderThenName(
    snapshot.docs.map((documentSnapshot) =>
      toLesson(
        documentSnapshot.id,
        documentSnapshot.data(),
        chapterNames.get(String(documentSnapshot.data().chapterId)),
      ),
    ),
  );
}

export async function getLessonById(id: string, options: { publishedOnly?: boolean } = {}) {
  const snapshot = await getFirebaseAdminDb().collection(lessonsCollection).doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  const lesson = toLesson(snapshot.id, snapshot.data() ?? {});

  if (options.publishedOnly && !lesson.published) {
    return null;
  }

  const chapter = await getChapterById(lesson.chapterId);

  if (options.publishedOnly && !chapter?.published) {
    return null;
  }

  return { ...lesson, chapterName: chapter?.name };
}

function getSafeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function uploadLessonPdf(file: File) {
  if (file.type !== "application/pdf") {
    throw new Error("Upload a PDF file.");
  }

  const path = `${lessonPdfFolder}/${crypto.randomUUID()}-${getSafeFileName(file.name)}`;
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

async function deleteLessonPdf(path: string) {
  if (!path) {
    return;
  }

  try {
    await getFirebaseAdminStorageBucket().file(path).delete();
  } catch {
    // Ignore missing storage objects so metadata cleanup can continue.
  }
}

export async function createLesson(values: LessonFormValues, pdfFile: File, adminId: string) {
  await assertChapterExists(values.chapterId);
  const pdf = await uploadLessonPdf(pdfFile);
  const ref = getFirebaseAdminDb().collection(lessonsCollection).doc();
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

  return toLesson(snapshot.id, snapshot.data() ?? record);
}

export async function updateLesson(
  id: string,
  values: LessonFormValues,
  adminId: string,
  pdfFile?: File,
) {
  await assertChapterExists(values.chapterId);
  const ref = getFirebaseAdminDb().collection(lessonsCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Lesson was not found.");
  }

  const existingLesson = toLesson(snapshot.id, snapshot.data() ?? {});
  const nextPdf = pdfFile ? await uploadLessonPdf(pdfFile) : null;

  await ref.update({
    ...values,
    ...(nextPdf ? { pdfUrl: nextPdf.path, pdfFileName: nextPdf.fileName } : {}),
    updatedBy: adminId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (nextPdf) {
    await deleteLessonPdf(existingLesson.pdfUrl);
  }

  const updated = await ref.get();

  return toLesson(updated.id, updated.data() ?? {});
}

export async function deleteLesson(id: string) {
  const ref = getFirebaseAdminDb().collection(lessonsCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Lesson was not found.");
  }

  const lesson = toLesson(snapshot.id, snapshot.data() ?? {});
  await ref.delete();
  await deleteLessonPdf(lesson.pdfUrl);

  return { deletedLessonId: id };
}

export async function getLessonPdfBuffer(id: string) {
  const lesson = await getLessonById(id, { publishedOnly: true });

  if (!lesson) {
    return null;
  }

  const [buffer] = await getFirebaseAdminStorageBucket().file(lesson.pdfUrl).download();

  return { buffer, fileName: lesson.pdfFileName };
}

async function assertChapterExists(chapterId: string) {
  const chapter = await getChapterById(chapterId);

  if (!chapter) {
    throw new Error("Choose an existing chapter.");
  }
}
