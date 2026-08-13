import { NextResponse } from "next/server";

import {
  listExams,
  listStudentExamAttempts,
  listStudentExamSubmissions,
} from "@/features/exams/services/server-exam-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const user = await requireActiveUser(request);
    const exams = await listExams({ publishedOnly: true });
    const [submissions, attempts] = await Promise.all([
      listStudentExamSubmissions(user.uid),
      listStudentExamAttempts(user.uid),
    ]);

    return NextResponse.json({ exams, submissions, attempts });
  } catch (error) {
    console.error("[exam] failed to list student exams", error);
    return errorResponse(error, "Exam request failed.");
  }
}
