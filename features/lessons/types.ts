export type Chapter = {
  id: string;
  name: string;
  description: string;
  order: number;
  published: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type LessonPdf = {
  id: string;
  path: string;
  fileName: string;
};

export type Lesson = {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  order: number;
  pdfs: LessonPdf[];
  pdfUrl: string;
  pdfFileName: string;
  published: boolean;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
  chapterName?: string;
};
