import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import type { OfficialResourceType } from "@/features/model-answers/types";
import { getMissingFirebaseAdminEnv, getFirebaseAdminStorageBucket } from "@/lib/firebase/admin";

const maxUploadSizeBytes = 15 * 1024 * 1024;

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

function getOfficialResourceType(file: File): OfficialResourceType {
  return file.type.startsWith("image/") ? "image" : "pdf";
}

function getSafeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function errorResponse(error: unknown) {
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "The mark scheme file could not be uploaded.",
    },
    { status: 400 },
  );
}

async function getVerifiedStorageBucket() {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const bucket = getFirebaseAdminStorageBucket();
  const [exists] = await bucket.exists();

  if (!exists) {
    throw new Error(
      `Firebase Storage bucket "${bucketName}" does not exist. Create the default bucket in Firebase Console > Storage, or set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET to the exact bucket name shown there.`,
    );
  }

  return bucket;
}

export async function POST(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Upload a PDF or image file.");
    }

    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      throw new Error("Upload a PDF or image file.");
    }

    if (file.size > maxUploadSizeBytes) {
      throw new Error("Upload a file smaller than 15 MB.");
    }

    const safeFileName = getSafeFileName(file.name);
    const path = `model-answers/mark-schemes/${crypto.randomUUID()}-${safeFileName}`;
    const bucket = await getVerifiedStorageBucket();
    const storageFile = bucket.file(path);
    const buffer = Buffer.from(await file.arrayBuffer());

    await storageFile.save(buffer, {
      contentType: file.type,
      resumable: false,
      metadata: {
        cacheControl: "private, max-age=3600",
      },
    });

    return NextResponse.json({
      path,
      fileName: file.name,
      type: getOfficialResourceType(file),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
