import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb, getFirebaseAdminStorageBucket } from "@/lib/firebase/admin";

import type { ChapterFormValues, LessonFormValues } from "../schemas";
import type { Chapter, Lesson, LessonPdf } from "../types";

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
  const pdfs = normalizeLessonPdfs(data);

  return {
    id,
    chapterId: typeof data.chapterId === "string" ? data.chapterId : "",
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    order: typeof data.order === "number" ? data.order : 0,
    pdfs,
    pdfUrl: typeof data.pdfUrl === "string" ? data.pdfUrl : "",
    pdfFileName: typeof data.pdfFileName === "string" ? data.pdfFileName : "",
    published: data.published === true,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
    chapterName,
  };
}

function normalizeLessonPdfs(data: FirebaseFirestore.DocumentData): LessonPdf[] {
  if (Array.isArray(data.pdfs)) {
    return data.pdfs
      .map((pdf, index) => {
        if (typeof pdf !== "object" || !pdf) {
          return null;
        }

        const path = "path" in pdf && typeof pdf.path === "string" ? pdf.path : "";
        const fileName = "fileName" in pdf && typeof pdf.fileName === "string" ? pdf.fileName : "";
        const pdfId = "id" in pdf && typeof pdf.id === "string" ? pdf.id : `pdf-${index + 1}`;

        if (!path || !fileName) {
          return null;
        }

        return { id: pdfId, path, fileName };
      })
      .filter((pdf): pdf is LessonPdf => Boolean(pdf));
  }

  if (typeof data.pdfUrl === "string" && typeof data.pdfFileName === "string") {
    return [{ id: "primary", path: data.pdfUrl, fileName: data.pdfFileName }];
  }

  return [];
}

function sortByOrderThenName<T extends { order: number; title?: string; name?: string }>(items: T[]) {
  return items.sort((a, b) => a.order - b.order || (a.name ?? a.title ?? "").localeCompare(b.name ?? b.title ?? ""));
}

export async function listChapters(options: { publishedOnly?: boolean } = {}) {
  const db = getFirebaseAdminDb();
  const query: FirebaseFirestore.Query = db.collection(chaptersCollection);

  if (options.publishedOnly) {
    const [chapterSnapshot, lessonSnapshot] = await Promise.all([
      db.collection(chaptersCollection).get(),
      db.collection(lessonsCollection).where("published", "==", true).get(),
    ]);
    const chapterIdsWithPublishedLessons = new Set(
      lessonSnapshot.docs
        .map((documentSnapshot) => documentSnapshot.data().chapterId)
        .filter((chapterId): chapterId is string => typeof chapterId === "string" && chapterId.length > 0),
    );

    return sortByOrderThenName(
      chapterSnapshot.docs
        .map((documentSnapshot) => toChapter(documentSnapshot.id, documentSnapshot.data()))
        .filter((chapter) => chapter.published || chapterIdsWithPublishedLessons.has(chapter.id)),
    );
  }

  const snapshot = await query.get();

  return sortByOrderThenName(
    snapshot.docs.map((documentSnapshot) => toChapter(documentSnapshot.id, documentSnapshot.data())),
  );
}

export async function listPublishedLessonCatalog() {
  const db = getFirebaseAdminDb();
  const [chapterSnapshot, lessonSnapshot] = await Promise.all([
    db.collection(chaptersCollection).get(),
    db.collection(lessonsCollection).where("published", "==", true).get(),
  ]);
  const chapterIdsWithPublishedLessons = new Set(
    lessonSnapshot.docs
      .map((documentSnapshot) => documentSnapshot.data().chapterId)
      .filter((chapterId): chapterId is string => typeof chapterId === "string" && chapterId.length > 0),
  );
  const chapters = sortByOrderThenName(
    chapterSnapshot.docs
      .map((documentSnapshot) => toChapter(documentSnapshot.id, documentSnapshot.data()))
      .filter((chapter) => chapter.published || chapterIdsWithPublishedLessons.has(chapter.id)),
  );
  const chapterNames = new Map(chapters.map((chapter) => [chapter.id, chapter.name]));
  const lessons = sortByOrderThenName(
    lessonSnapshot.docs.map((documentSnapshot) =>
      toLesson(
        documentSnapshot.id,
        documentSnapshot.data(),
        chapterNames.get(String(documentSnapshot.data().chapterId)),
      ),
    ),
  );

  return { chapters, lessons };
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
    throw new Error("Topic was not found.");
  }

  await ref.update({ ...values, updatedAt: FieldValue.serverTimestamp() });
  const updated = await ref.get();

  return toChapter(updated.id, updated.data() ?? values);
}

export async function deleteChapter(id: string) {
  const db = getFirebaseAdminDb();
  const lessons = await db.collection(lessonsCollection).where("chapterId", "==", id).limit(1).get();

  if (!lessons.empty) {
    throw new Error("Move or delete this topic's lessons before deleting the topic.");
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

  return { ...lesson, chapterName: chapter?.name };
}

function getSafeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function uploadLessonPdf(file: File): Promise<LessonPdf> {
  if (file.type !== "application/pdf") {
    throw new Error("Upload a PDF file.");
  }

  const id = crypto.randomUUID();
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

  return { id, path, fileName: file.name };
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

export async function createLesson(values: LessonFormValues, pdfFiles: File[], adminId: string) {
  await assertChapterExists(values.chapterId);
  const pdfs = await Promise.all(pdfFiles.map((pdfFile) => uploadLessonPdf(pdfFile)));

  if (pdfs.length === 0) {
    throw new Error("Upload at least one lesson PDF.");
  }

  const primaryPdf = pdfs[0];
  const ref = getFirebaseAdminDb().collection(lessonsCollection).doc();
  const record = {
    ...values,
    pdfs,
    pdfUrl: primaryPdf.path,
    pdfFileName: primaryPdf.fileName,
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
  pdfFiles: File[] = [],
) {
  await assertChapterExists(values.chapterId);
  const ref = getFirebaseAdminDb().collection(lessonsCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Lesson was not found.");
  }

  const existingLesson = toLesson(snapshot.id, snapshot.data() ?? {});
  const uploadedPdfs = await Promise.all(pdfFiles.map((pdfFile) => uploadLessonPdf(pdfFile)));
  const nextPdfs = [...existingLesson.pdfs, ...uploadedPdfs];
  const primaryPdf = nextPdfs[0];

  await ref.update({
    ...values,
    pdfs: nextPdfs,
    ...(primaryPdf ? { pdfUrl: primaryPdf.path, pdfFileName: primaryPdf.fileName } : {}),
    updatedBy: adminId,
    updatedAt: FieldValue.serverTimestamp(),
  });

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
  await Promise.all(lesson.pdfs.map((pdf) => deleteLessonPdf(pdf.path)));

  return { deletedLessonId: id };
}

export async function getLessonPdfBuffer(id: string, pdfId?: string) {
  const lesson = await getLessonById(id, { publishedOnly: true });

  if (!lesson) {
    return null;
  }

  const pdf = lesson.pdfs.find((item) => item.id === pdfId) ?? lesson.pdfs[0];

  if (!pdf) {
    return null;
  }

  const [buffer] = await getFirebaseAdminStorageBucket().file(pdf.path).download();

  return { buffer, fileName: pdf.fileName };
}

async function assertChapterExists(chapterId: string) {
  const chapter = await getChapterById(chapterId);

  if (!chapter) {
    throw new Error("Choose an existing topic.");
  }
}
