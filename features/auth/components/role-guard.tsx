"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "../hooks/use-auth";
import type { UserRole } from "../types";

type RoleGuardProps = {
  allowedRoles: UserRole[];
  children: ReactNode;
};

function getFallbackPath(role?: UserRole) {
  return role === "admin" ? "/admin" : "/dashboard";
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { profile, status } = useAuth();
  const router = useRouter();
  const isAllowed = profile ? allowedRoles.includes(profile.role) : false;

  useEffect(() => {
    if (status === "authenticated" && profile && !isAllowed) {
      router.replace(getFallbackPath(profile.role));
    }
  }, [isAllowed, profile, router, status]);

  if (status !== "authenticated" || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        Checking access
      </div>
    );
  }

  return children;
}
