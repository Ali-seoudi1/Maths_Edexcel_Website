export type ExamSession = "may-june" | "oct-nov";

export type OfficialResourceType = "pdf" | "image";

export type ModelAnswer = {
  id: string;
  examYear: number;
  session: ExamSession;
  paper: string;
  questionNumber: string;
  officialMarkSchemePath: string;
  officialMarkSchemeFileName: string;
  officialMarkSchemeType: OfficialResourceType;
  teacherSolutionHtml: string;
  published: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ModelAnswerFilters = {
  examYear?: number;
  session?: ExamSession;
  paper?: string;
  questionNumber?: string;
  published?: boolean;
};

export type ModelAnswerPayload = {
  examYear: number;
  session: ExamSession;
  paper: string;
  questionNumber: string;
  officialMarkSchemePath: string;
  officialMarkSchemeFileName: string;
  officialMarkSchemeType: OfficialResourceType;
  teacherSolutionHtml: string;
  published: boolean;
};
