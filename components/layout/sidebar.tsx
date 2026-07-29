"use client";

import { LogOut, Sigma } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavigation } from "@/constants";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const initials =
    profile?.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "EM";

  return (
    <aside className="flex h-full flex-col bg-sidebar px-4 py-8 text-sidebar-foreground">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success text-success-foreground shadow-soft">
          <Sigma className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold leading-5">Mr. Farouk - Math</p>
          <p className="truncate text-xs text-sidebar-muted">Edexcel iGCSE & A-Level</p>
        </div>
      </div>

      <nav className="mt-10 space-y-2" aria-label="Dashboard navigation">
        {dashboardNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-sidebar-muted transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive && "bg-sidebar-accent text-sidebar-foreground shadow-soft",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-5">
        <p className="text-xs text-sidebar-muted">Logged in as</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-soft text-sm font-bold text-amber-700">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{profile?.fullName ?? "Student"}</p>
            <p className="truncate text-xs capitalize text-sidebar-muted">
              {profile?.role ?? "student"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mt-5 w-full justify-start rounded-xl px-4 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
