import type { Metadata } from "next";

import { SignInForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Secure sign in for Edexcel Mathematics students and administrators.",
};

export default function SignInPage() {
  return <SignInForm />;
}
