import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getMissingFirebaseAdminEnv } from "@/lib/firebase/admin";
import { studentFormSchema } from "@/features/admin/students/schemas";
import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import {
  createStudentAccount,
  listStudentAccounts,
} from "@/features/admin/students/services/server-student-service";

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Student details are invalid." }, { status: 422 });
  }

  const message = error instanceof Error ? error.message : "Student request failed.";
  const status = message.includes("Admin SDK environment") ? 501 : 400;

  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const missingAdminEnv = getMissingFirebaseAdminEnv();

  if (missingAdminEnv.length > 0) {
    return NextResponse.json(
      {
        error: `Firebase Admin SDK is not configured. Add the missing server environment variables before creating student accounts. Missing: ${missingAdminEnv.join(
          ", ",
        )}.`,
      },
      { status: 501 },
    );
  }

  try {
    await requireAdmin(request);
    const values = studentFormSchema.parse(await request.json());
    const result = await createStudentAccount(values, new URL(request.url).origin);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  const missingAdminEnv = getMissingFirebaseAdminEnv();

  if (missingAdminEnv.length > 0) {
    return NextResponse.json(
      {
        error: `Firebase Admin SDK is not configured. Add the missing server environment variables before listing student accounts. Missing: ${missingAdminEnv.join(
          ", ",
        )}.`,
      },
      { status: 501 },
    );
  }

  try {
    await requireAdmin(request);
    const students = await listStudentAccounts();

    return NextResponse.json({ students });
  } catch (error) {
    return errorResponse(error);
  }
}
