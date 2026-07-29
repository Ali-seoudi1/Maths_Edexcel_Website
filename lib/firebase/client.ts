import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const requiredFirebaseClientEnv = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export function getMissingFirebaseClientEnv(): string[] {
  const envMap: Record<(typeof requiredFirebaseClientEnv)[number], string | undefined> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: firebaseClientConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseClientConfig.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseClientConfig.projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseClientConfig.storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseClientConfig.messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: firebaseClientConfig.appId,
  };

  return requiredFirebaseClientEnv.filter((key) => !envMap[key]);
}

function assertFirebaseClientConfig() {
  const missingEnv = getMissingFirebaseClientEnv();

  if (missingEnv.length > 0) {
    throw new Error(
      `Missing Firebase client environment variables: ${missingEnv.join(
        ", ",
      )}. Add them to .env.local.`,
    );
  }
}

export function getFirebaseClientApp(): FirebaseApp {
  const existingApp = getApps()[0];

  if (existingApp) {
    return existingApp;
  }

  assertFirebaseClientConfig();

  return initializeApp(firebaseClientConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseClientApp());
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseClientApp());
}
