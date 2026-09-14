import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const adminUid = "VU12FvKPbDVO9nTQCLze3oiupY72";
const testStudentCode = "TEST-STUDENT-001";
const execute = process.argv.includes("--execute");

function getApp() {
  if (getApps()[0]) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY first.");
  }
  return initializeApp({ credential: cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") }) });
}

async function main() {
  const app = getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const adminRef = db.collection("users").doc(adminUid);
  const admin = await adminRef.get();
  if (!admin.exists || admin.data()?.role !== "admin" || admin.data()?.active !== true) throw new Error("Protected admin account is not valid.");

  const email = process.env.TEST_STUDENT_EMAIL?.trim().toLowerCase();
  const password = process.env.TEST_STUDENT_PASSWORD;
  const existingCode = await db.collection("users").where("studentCode", "==", testStudentCode).get();
  const existingAuth = email ? await auth.getUserByEmail(email).catch(() => null) : null;
  console.log(JSON.stringify({ mode: execute ? "EXECUTE" : "DRY RUN", adminUid, testStudentCode, existingTestStudentProfiles: existingCode.docs.map((doc) => doc.id), emailConfigured: Boolean(email), passwordConfigured: Boolean(password) }, null, 2));

  if (!execute) return;
  if (!email || !password) throw new Error("Set TEST_STUDENT_EMAIL and TEST_STUDENT_PASSWORD for provisioning.");
  if (existingCode.size > 1) throw new Error("Duplicate TEST-STUDENT-001 profiles found.");
  if (existingAuth && existingCode.size === 0) throw new Error(`Auth account already exists for ${email}; refusing to create an unclassified test account.`);
  await adminRef.set({ role: "admin", active: true, isTestAccount: true }, { merge: true });
  if (existingCode.size === 1) return;

  const user = await auth.createUser({ email, password, displayName: "TEST STUDENT", disabled: false });
  await db.collection("users").doc(user.uid).set({
    uid: user.uid,
    email,
    fullName: "TEST STUDENT",
    role: "student",
    active: true,
    isTestAccount: true,
    studentCode: testStudentCode,
    yearGroup: "Y10",
    mathTrack: "OL",
    createdAt: FieldValue.serverTimestamp(),
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
