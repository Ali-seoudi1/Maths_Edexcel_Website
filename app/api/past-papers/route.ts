import { NextResponse } from "next/server";

import { requireActiveUser } from "@/features/lessons/services/route-helpers";
import { getPastPapersSettings } from "@/features/past-papers/services/server-past-papers-service";
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
    await requireActiveUser(request);
    const settings = await getPastPapersSettings();

    return NextResponse.json({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}
