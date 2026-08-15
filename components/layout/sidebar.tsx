"use client";

import { Lock, Sigma } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { dashboardNavigation } from "@/constants";
import { SignOutButton } from "@/components/shared/sign-out-button";
import {
  getUnreadAnnouncementCount,
  unreadAnnouncementCountChangedEvent,
} from "@/features/announcements/services/announcement-service";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const initials =
    profile?.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "EM";

  useEffect(() => {
    let mounted = true;

    function handleUnreadCountChanged(event: Event) {
      const detail = event instanceof CustomEvent ? event.detail : null;
      const unreadCount =
        detail && typeof detail.unreadCount === "number" ? detail.unreadCount : 0;

      setUnreadAnnouncements(unreadCount);
    }

    window.addEventListener(unreadAnnouncementCountChangedEvent, handleUnreadCountChanged);

    void getUnreadAnnouncementCount()
      .then((result) => {
        if (mounted) setUnreadAnnouncements(result.unreadCount);
      })
      .catch(() => {
        if (mounted) setUnreadAnnouncements(0);
      });

    return () => {
      mounted = false;
      window.removeEventListener(unreadAnnouncementCountChangedEvent, handleUnreadCountChanged);
    };
  }, [pathname]);

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-sidebar px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 text-sidebar-foreground sm:py-8">
      <div className="shrink-0 flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success text-success-foreground shadow-soft">
          <Sigma className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold leading-5">Mr. Omar - Math</p>
          <p className="truncate text-xs text-sidebar-muted">Edexcel IGCSE </p>
        </div>
      </div>

      <nav className="mt-8 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] sm:mt-10 [&::-webkit-scrollbar]:hidden" aria-label="Dashboard navigation">
        {dashboardNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isLocked = item.locked;

          if (isLocked) {
            return (
              <div
                key={item.href}
                className={cn(
                  "flex h-12 cursor-not-allowed items-center gap-3 rounded-xl px-4 text-sm font-semibold text-sidebar-muted/70",
                  "border border-white/5 bg-white/[0.03]",
                )}
                aria-disabled="true"
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.title}</span>
                <Lock className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={onNavigate}
              className={cn(
                "flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-sidebar-muted transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive && "bg-sidebar-accent text-sidebar-foreground shadow-soft",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.title}</span>
              {item.href === "/announcements" && unreadAnnouncements > 0 ? (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  {unreadAnnouncements}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 shrink-0 border-t border-white/10 pt-5">
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
        <SignOutButton
          variant="ghost"
          className="mt-5 w-full justify-start rounded-xl px-4 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
        />
      </div>
    </aside>
  );
}
