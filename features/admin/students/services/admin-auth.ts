import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase/admin";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

export async function requireAdmin(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    throw new Error("Missing admin authentication token.");
  }

  const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
  const profileSnapshot = await getFirebaseAdminDb().collection("users").doc(decodedToken.uid).get();
  const profile = profileSnapshot.data();

  if (!profileSnapshot.exists || profile?.role !== "admin" || profile.active !== true) {
    throw new Error("Admin access is required.");
  }

  return decodedToken;
}
