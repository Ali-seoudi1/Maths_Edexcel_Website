import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getMissingFirebaseAdminEnv } from "@/lib/firebase/admin";
import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { modelAnswerPayloadSchema } from "@/features/model-answers/schemas";
import {
  createModelAnswer,
  listModelAnswers,
} from "@/features/model-answers/services/server-model-answer-service";
import type { ExamSession } from "@/features/model-answers/types";

function adminSdkUnavailableResponse() {
  const missingAdminEnv = getMissingFirebaseAdminEnv();

  if (missingAdminEnv.length === 0) {
    return null;
  }

  return NextResponse.json(
    {
      error: `Firebase Admin SDK is not configured. Missing: ${missingAdminEnv.join(", ")}.`,
    },
    { status: 501 },
  );
}

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Model answer details are invalid." }, { status: 422 });
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Model answer request failed." },
    { status: 400 },
  );
}

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const params = new URL(request.url).searchParams;
    const examYear = params.get("examYear");
    const session = params.get("session");
    const paper = params.get("paper");
    const questionNumber = params.get("questionNumber");
    const published = params.get("published");
    const modelAnswers = await listModelAnswers({
      examYear: examYear ? Number(examYear) : undefined,
      session:
        session === "may-june" || session === "oct-nov" ? (session as ExamSession) : undefined,
      paper: paper ?? undefined,
      questionNumber: questionNumber ?? undefined,
      published: published === "true" ? true : published === "false" ? false : undefined,
    });

    return NextResponse.json({ modelAnswers });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const admin = await requireAdmin(request);
    const values = modelAnswerPayloadSchema.parse(await request.json());
    const modelAnswer = await createModelAnswer(values, admin.uid);

    return NextResponse.json({ modelAnswer }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
