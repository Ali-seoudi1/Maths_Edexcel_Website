import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebase/client";

import { cacheUserProfile, clearUserProfileCache, getUserProfile } from "./user-service";
import type { UserProfile } from "../types";

export type SignInResult = {
  user: User;
  profile: UserProfile;
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

let authPersistencePromise: Promise<void> | null = null;

export function initializeAuthPersistence() {
  if (!authPersistencePromise) {
    const auth = getFirebaseAuth();
    authPersistencePromise = setPersistence(auth, browserLocalPersistence);
  }

  return authPersistencePromise;
}

function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  if (
    code === "auth/invalid-credential" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password"
  ) {
    return "The email or password you entered is incorrect.";
  }

  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait a moment before trying again.";
  }

  if (error instanceof Error && error.message.includes("Missing Firebase client environment")) {
    return error.message;
  }

  return "We could not sign you in. Please try again.";
}

export async function signInWithEmail(email: string, password: string): Promise<SignInResult> {
  const auth = getFirebaseAuth();

  try {
    await initializeAuthPersistence();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(credential.user.uid);

    if (!profile) {
      await signOut(auth);
      throw new AuthError("Your account profile could not be found. Please contact the teacher.");
    }

    if (!profile.active) {
      await signOut(auth);
      throw new AuthError("Your account is inactive. Please contact the teacher.");
    }

    cacheUserProfile(profile);

    return {
      user: credential.user,
      profile,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    throw new AuthError("Password reset failed. Please try again.");
  }
}

export async function signOutCurrentUser() {
  clearUserProfileCache();
  await signOut(getFirebaseAuth());
}

export async function sendPasswordReset(email: string) {
  try {
    const response = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new AuthError(data?.error ?? "Password reset failed.");
    }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    throw new AuthError(getAuthErrorMessage(error));
  }
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
