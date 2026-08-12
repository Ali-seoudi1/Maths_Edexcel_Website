"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "../hooks/use-auth";

function getRedirectForRole(role: "admin" | "student") {
  return role === "admin" ? "/admin" : "/dashboard";
}

export function AuthenticatedHomeRedirect() {
  const { isLoading, profile, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && profile) {
      router.replace(getRedirectForRole(profile.role));
    }
  }, [profile, router, status]);

  if (isLoading || status === "authenticated") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        Loading
      </div>
    );
  }

  return null;
}
