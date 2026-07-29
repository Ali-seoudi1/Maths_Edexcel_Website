"use client";

import { Bell, LogOut, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";

type TopBarProps = {
  onMenuClick: () => void;
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const { profile, signOut } = useAuth();
  const initials =
    profile?.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "EM";

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-4 px-5 sm:px-8 lg:px-11">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl bg-card shadow-soft lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>

        <div className="ml-auto flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl bg-card shadow-soft"
            aria-label="Search"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl bg-card shadow-soft"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl bg-card shadow-soft"
            aria-label="Sign out"
            onClick={() => void signOut()}
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </Button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-soft text-sm font-bold text-amber-700 shadow-soft"
            aria-label="Open profile"
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  );
}
