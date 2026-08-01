import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getMissingFirebaseAdminEnv } from "@/lib/firebase/admin";
import { modelAnswerSearchSchema } from "@/features/model-answers/schemas";
import {
  requireActiveUser,
  searchPublishedModelAnswer,
} from "@/features/model-answers/services/server-model-answer-service";

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Search fields are invalid." }, { status: 422 });
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Model answer search failed." },
    { status: 400 },
  );
}

export async function GET(request: Request) {
  const missingAdminEnv = getMissingFirebaseAdminEnv();

  if (missingAdminEnv.length > 0) {
    return NextResponse.json(
      {
        error: `Firebase Admin SDK is not configured. Missing: ${missingAdminEnv.join(", ")}.`,
      },
      { status: 501 },
    );
  }

  try {
    await requireActiveUser(request);
    const params = new URL(request.url).searchParams;
    const values = modelAnswerSearchSchema.parse({
      examYear: params.get("examYear"),
      session: params.get("session"),
      paper: params.get("paper"),
      questionNumber: params.get("questionNumber"),
    });
    const modelAnswer = await searchPublishedModelAnswer({
      examYear: values.examYear,
      session: values.session,
      paper: values.paper,
      questionNumber: values.questionNumber,
      published: true,
    });

    return NextResponse.json({ modelAnswer });
  } catch (error) {
    return errorResponse(error);
  }
}
