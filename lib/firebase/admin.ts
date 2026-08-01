import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

const requiredFirebaseAdminEnv = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

function getPrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function getProjectId() {
  return process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

export function getMissingFirebaseAdminEnv(): string[] {
  const envMap: Record<(typeof requiredFirebaseAdminEnv)[number], string | undefined> = {
    FIREBASE_PROJECT_ID: getProjectId(),
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  };

  return requiredFirebaseAdminEnv.filter((key) => !envMap[key]);
}

function assertFirebaseAdminConfig() {
  const missingEnv = getMissingFirebaseAdminEnv();

  if (missingEnv.length > 0) {
    throw new Error(
      `Missing Firebase Admin SDK environment variables: ${missingEnv.join(
        ", ",
      )}. Add them to .env.local before using admin user management.`,
    );
  }
}

export function getFirebaseAdminApp(): App {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  assertFirebaseAdminConfig();

  return initializeApp({
    credential: cert({
      projectId: getProjectId(),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage(): Storage {
  return getStorage(getFirebaseAdminApp());
}

export function getFirebaseAdminStorageBucket() {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!bucketName) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local.");
  }

  return getFirebaseAdminStorage().bucket(bucketName);
}
