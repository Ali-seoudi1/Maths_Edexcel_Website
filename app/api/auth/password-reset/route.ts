import { NextResponse } from "next/server";
import { z } from "zod";

import { sendPasswordResetWithResend } from "@/features/auth/services/server-password-reset-service";
import { getMissingEmailEnv } from "@/features/email";
import { getMissingFirebaseAdminEnv } from "@/lib/firebase/admin";

const passwordResetRequestSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  const missingAdminEnv = getMissingFirebaseAdminEnv();

  if (missingAdminEnv.length > 0) {
    return NextResponse.json(
      {
        error: `Firebase Admin SDK is not configured. Missing: ${missingAdminEnv.join(", ")}.`,
      },
      { status: 501 },
    );
  }

  const missingEmailEnv = getMissingEmailEnv();

  if (missingEmailEnv.length > 0) {
    return NextResponse.json(
      {
        error: `Email is not configured. Missing: ${missingEmailEnv.join(", ")}.`,
      },
      { status: 501 },
    );
  }

  const parsed = passwordResetRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 });
  }

  try {
    await sendPasswordResetWithResend(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset email failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
