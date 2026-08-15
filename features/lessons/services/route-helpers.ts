import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  getMissingFirebaseAdminEnv,
} from "@/lib/firebase/admin";

export function adminSdkUnavailableResponse() {
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

export function errorResponse(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Submitted details are invalid." }, { status: 422 });
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: 400 },
  );
}

export function formDataToLessonPayload(formData: FormData) {
  return {
    chapterId: String(formData.get("chapterId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    published: formData.get("published") === "true",
  };
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }

  return new URL(request.url).searchParams.get("token");
}

export async function requireActiveUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    throw new Error("Missing authentication token.");
  }

  const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
  const profileSnapshot = await getFirebaseAdminDb().collection("users").doc(decodedToken.uid).get();
  const profile = profileSnapshot.data();

  if (!profileSnapshot.exists || profile?.active !== true) {
    throw new Error("Active account access is required.");
  }

  return {
    uid: decodedToken.uid,
    role: profile.role === "admin" ? "admin" : "student",
  };
}
