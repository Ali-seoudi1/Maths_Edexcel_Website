export type UserRole = "admin" | "student";

export type UserProfile = {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
