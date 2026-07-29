"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";

export function AdminSignOutButton() {
  const { signOut } = useAuth();

  return (
    <Button type="button" variant="outline" onClick={() => void signOut()}>
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Sign out
    </Button>
  );
}
