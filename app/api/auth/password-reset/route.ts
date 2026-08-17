import { NextResponse } from "next/server";
import { z } from "zod";

import { sendPasswordResetWithResend } from "@/features/auth/services/server-password-reset-service";
import { getMissingEmailEnv } from "@/features/email";
import { getMissingFirebaseAdminEnv } from "@/lib/firebase/admin";

const passwordResetRequestSchema = z.object({
  email: z.string().trim().email(),
});

const rateLimitWindowMs = 15 * 60 * 1000;
const maxPasswordResetRequests = 5;
const passwordResetAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isPasswordResetRateLimited(request: Request, email: string) {
  const now = Date.now();
  const key = `${getClientIp(request)}:${email.toLowerCase()}`;
  const currentAttempt = passwordResetAttempts.get(key);

  if (!currentAttempt || currentAttempt.resetAt <= now) {
    passwordResetAttempts.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });
    return false;
  }

  if (currentAttempt.count >= maxPasswordResetRequests) {
    return true;
  }

  passwordResetAttempts.set(key, {
    ...currentAttempt,
    count: currentAttempt.count + 1,
  });

  return false;
}

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

  if (isPasswordResetRateLimited(request, parsed.data.email)) {
    return NextResponse.json(
      { error: "Too many password reset requests. Try again later." },
      { status: 429 },
    );
  }

  try {
    await sendPasswordResetWithResend(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset email failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
