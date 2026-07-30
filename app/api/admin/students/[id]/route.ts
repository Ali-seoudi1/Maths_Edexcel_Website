import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getMissingFirebaseAdminEnv } from "@/lib/firebase/admin";
import { editStudentFormSchema } from "@/features/admin/students/schemas";
import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import {
  deleteStudentAccount,
  updateStudentAccount,
} from "@/features/admin/students/services/server-student-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Student details are invalid." }, { status: 422 });
  }

  const message = error instanceof Error ? error.message : "Student request failed.";
  const status = message.includes("Admin SDK environment") ? 501 : 400;

  return NextResponse.json({ error: message }, { status });
}

function adminSdkTodoResponse() {
  const missingAdminEnv = getMissingFirebaseAdminEnv();

  if (missingAdminEnv.length === 0) {
    return null;
  }

  return NextResponse.json(
    {
      error: `Firebase Admin SDK is not configured. Add the missing server environment variables before mutating student accounts. Missing: ${missingAdminEnv.join(
        ", ",
      )}.`,
    },
    { status: 501 },
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const todoResponse = adminSdkTodoResponse();

  if (todoResponse) {
    return todoResponse;
  }

  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const values = editStudentFormSchema.parse(await request.json());
    const student = await updateStudentAccount(id, values);

    return NextResponse.json({ student });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const todoResponse = adminSdkTodoResponse();

  if (todoResponse) {
    return todoResponse;
  }

  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const result = await deleteStudentAccount(id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
