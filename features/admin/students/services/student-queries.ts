import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";

import type { Student } from "../types";

function formatCreatedAt(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }

  return null;
}

export function parseStudent(data: DocumentData | undefined, uid: string): Student | null {
  if (!data || data.role !== "student") {
    return null;
  }

  return {
    uid,
    fullName: typeof data.fullName === "string" ? data.fullName : "",
    email: typeof data.email === "string" ? data.email : "",
    role: "student",
    active: data.active === true,
    createdAt: formatCreatedAt(data.createdAt),
  };
}

export function subscribeToStudents(
  callback: (students: Student[]) => void,
  onError?: (error: Error) => void,
) {
  const studentsQuery = query(collection(getFirebaseDb(), "users"), where("role", "==", "student"));

  return onSnapshot(
    studentsQuery,
    (snapshot) => {
      const students = snapshot.docs
        .map((studentDoc) => parseStudent(studentDoc.data(), studentDoc.id))
        .filter((student): student is Student => Boolean(student))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      callback(students);
    },
    onError,
  );
}

export async function getStudentById(uid: string): Promise<Student | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return parseStudent(snapshot.data(), snapshot.id);
}
