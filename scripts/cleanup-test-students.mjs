import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const protectedAdminUid = "VU12FvKPbDVO9nTQCLze3oiupY72";
const targetStudentUids = [
  "6JDO78TaKXQ4C21WbFQKQ1yOFGL2",
  "Ur4dIg997dR6drYmxAvf4W5nAzT2",
  "v81tmivwyih7o7oF0ScSeLUJUkq2",
];
const studentCollections = [
  "monthlyReports",
  "combinedReports",
  "notifications",
  "assignmentSubmissions",
  "quizAttempts",
  "quizSubmissions",
  "examAttempts",
  "examSubmissions",
];
const execute = process.argv.includes("--execute");
const resetCounter = process.argv.includes("--reset-counter");

function getApp() {
  if (getApps()[0]) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY first.");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

function timestamp(value) {
  return value && typeof value.toDate === "function" ? value.toDate().toISOString() : value ?? null;
}

function pathsFrom(value, paths = new Set()) {
  if (Array.isArray(value)) value.forEach((item) => pathsFrom(item, paths));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => {
    if (typeof item === "string" && /path|url/i.test(key) && item) paths.add(item);
    else pathsFrom(item, paths);
  });
  return paths;
}

function recordSummary(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    status: data.status ?? null,
    period: data.period ?? null,
    fromMonth: data.fromMonth ?? null,
    toMonth: data.toMonth ?? null,
    type: data.type ?? null,
    paths: [...pathsFrom(data)],
  };
}

async function main() {
  const app = getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const bucket = getStorage(app).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  const adminProfile = await db.collection("users").doc(protectedAdminUid).get();

  if (!adminProfile.exists || adminProfile.data()?.role !== "admin" || adminProfile.data()?.active !== true) {
    throw new Error("Protected Omar admin profile is missing, inactive, or not an admin.");
  }

  const authUsers = new Map();
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    page.users.forEach((user) => authUsers.set(user.uid, user));
    pageToken = page.pageToken;
  } while (pageToken);

  const allStudents = await db.collection("users").where("role", "==", "student").get();
  const unexpectedStudents = allStudents.docs.filter(
    (doc) => !targetStudentUids.includes(doc.id) && doc.data().isTestAccount !== true,
  );
  const allStorageFiles = await bucket.getFiles().then(([files]) => files);
  const referencedPaths = new Set();

  for (const collectionName of ["assignments", "quizzes", "exams", ...studentCollections]) {
    const snapshot = await db.collection(collectionName).get();
    snapshot.docs.forEach((doc) => pathsFrom(doc.data(), referencedPaths));
  }

  const report = { targets: [], orphanedStorage: [], ambiguousStorage: [], preservedContent: [] };
  for (const uid of targetStudentUids) {
    const profile = await db.collection("users").doc(uid).get();
    if (profile.exists && profile.data()?.role !== "student") throw new Error(`Target ${uid} is not a student.`);
    const targetStoragePaths = new Set();

    const target = {
      uid,
      auth: authUsers.has(uid) ? { email: authUsers.get(uid).email, disabled: authUsers.get(uid).disabled } : null,
      profile: profile.exists ? { ...profile.data(), createdAt: timestamp(profile.data()?.createdAt) } : null,
      records: {},
      storage: [],
    };

    for (const collectionName of studentCollections) {
      const snapshot = await db.collection(collectionName).where("studentId", "==", uid).get();
      target.records[collectionName] = snapshot.docs.map(recordSummary);
      snapshot.docs.forEach((doc) => pathsFrom(doc.data(), targetStoragePaths));
    }
    target.storage = allStorageFiles.filter((file) => targetStoragePaths.has(file.name)).map((file) => file.name);
    report.targets.push(target);
  }

  report.orphanedStorage = allStorageFiles
    .filter((file) => !referencedPaths.has(file.name) && !file.name.startsWith("assignment-solutions/"))
    .map((file) => file.name);
  report.ambiguousStorage = allStorageFiles
    .filter((file) => !referencedPaths.has(file.name) && file.name.startsWith("assignment-solutions/"))
    .map((file) => file.name);
  report.preservedContent = ["assignments", "quizzes", "exams", "quiz-pdfs/*", "exam-pdfs/*"];

  console.log(JSON.stringify({ mode: execute ? "EXECUTE" : "DRY RUN", protectedAdminUid, unexpectedStudents: unexpectedStudents.map((doc) => doc.id), ...report }, null, 2));

  if (!execute) return;
  if (unexpectedStudents.length > 0) throw new Error("Unexpected real student data detected; refusing cleanup.");
  if (targetStudentUids.includes(protectedAdminUid)) throw new Error("Protected admin is in the delete list.");

  for (const uid of targetStudentUids) {
    const target = report.targets.find((item) => item.uid === uid);
    for (const collectionName of studentCollections) {
      const snapshot = await db.collection(collectionName).where("studentId", "==", uid).get();
      await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
    }
    await Promise.all((target?.storage ?? []).map((path) => bucket.file(path).delete()));
    await db.collection("users").doc(uid).delete();
    await db.collection("students").doc(uid).delete().catch(() => undefined);
    if (authUsers.has(uid)) await auth.deleteUser(uid);
  }

  if (resetCounter) {
    const remainingRealStudents = (await db.collection("users").where("role", "==", "student").get()).docs.filter(
      (doc) => doc.data().isTestAccount !== true,
    );
    if (remainingRealStudents.length > 0) throw new Error("Real students remain; counter was not reset.");
    await db.collection("systemCounters").doc("studentCodes").set(
      { nextSequence: 1, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
