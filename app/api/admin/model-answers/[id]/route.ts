import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getMissingFirebaseAdminEnv } from "@/lib/firebase/admin";
import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { modelAnswerPayloadSchema } from "@/features/model-answers/schemas";
import {
  deleteModelAnswer,
  getModelAnswerById,
  updateModelAnswer,
} from "@/features/model-answers/services/server-model-answer-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const modelAnswer = await getModelAnswerById(id);

    if (!modelAnswer) {
      return NextResponse.json({ error: "Model answer was not found." }, { status: 404 });
    }

    return NextResponse.json({ modelAnswer });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const values = modelAnswerPayloadSchema.parse(await request.json());
    const modelAnswer = await updateModelAnswer(id, values, admin.uid);

    return NextResponse.json({ modelAnswer });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const result = await deleteModelAnswer(id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
