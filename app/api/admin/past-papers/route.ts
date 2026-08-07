import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { pastPapersSettingsSchema } from "@/features/past-papers/schemas";
import {
  getPastPapersSettings,
  removePastPapersSettings,
  savePastPapersSettings,
} from "@/features/past-papers/services/server-past-papers-service";
import { getMissingFirebaseAdminEnv } from "@/lib/firebase/admin";

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
    return NextResponse.json({ error: "Past papers URL is invalid." }, { status: 422 });
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Past papers request failed." },
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
    const settings = await getPastPapersSettings();

    return NextResponse.json({ settings });
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
    const values = pastPapersSettingsSchema.parse(await request.json());
    const settings = await savePastPapersSettings(values, admin.uid);

    return NextResponse.json({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const admin = await requireAdmin(request);
    const settings = await removePastPapersSettings(admin.uid);

    return NextResponse.json({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}
