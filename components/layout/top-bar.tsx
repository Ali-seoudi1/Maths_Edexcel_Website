"use client";

import { Bell, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

type TopBarProps = {
  onMenuClick: () => void;
};

export function TopBar({ onMenuClick }: TopBarProps) {
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
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-soft text-sm font-bold text-amber-700 shadow-soft"
            aria-label="Open profile"
          >
            NS
          </button>
        </div>
      </div>
    </header>
  );
}
