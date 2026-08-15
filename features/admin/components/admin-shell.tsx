"use client";

import {
  ClipboardCheck,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  Archive,
  Megaphone,
  LibraryBig,
  LayoutDashboard,
  Menu,
  PenSquare,
  UserRoundPlus,
  UsersRound,
  Video,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { ToastProvider } from "@/components/ui/toast";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";

const adminNavigation = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Students", href: "/admin/students", icon: UsersRound },
  { title: "New Student", href: "/admin/students/new", icon: UserRoundPlus },
  { title: "Topics", href: "/admin/chapters", icon: LibraryBig },
  { title: "Lessons", href: "/admin/lessons", icon: GraduationCap },
  { title: "Past Papers & MS", href: "/admin/past-papers", icon: Archive },
  { title: "Assignments", href: "/admin/assignments", icon: PenSquare },
  { title: "Quizzes", href: "/admin/quizzes", icon: ClipboardCheck },
  { title: "Exams", href: "/admin/exams", icon: ClipboardList },
  { title: "Live Meeting", href: "/admin/live-meeting", icon: Video },
  { title: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { title: "Key Questions", href: "/admin/model-answers", icon: FileQuestion },
];

type AdminShellProps = {
  children: ReactNode;
};

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { profile } = useAuth();

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r bg-card px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:py-6">
      <Link href="/admin" className="flex shrink-0 items-center gap-3 px-2" onClick={onNavigate}>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Admin Console</p>
          <p className="truncate text-xs text-muted-foreground">User Management</p>
        </div>
      </Link>

      <nav className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] sm:mt-8 [&::-webkit-scrollbar]:hidden" aria-label="Admin navigation">
        {adminNavigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/admin/students" && pathname.startsWith("/admin/students/")) ||
            (item.href === "/admin/chapters" && pathname.startsWith("/admin/chapters/")) ||
            (item.href === "/admin/lessons" && pathname.startsWith("/admin/lessons/")) ||
            (item.href === "/admin/past-papers" && pathname.startsWith("/admin/past-papers/")) ||
            (item.href === "/admin/assignments" && pathname.startsWith("/admin/assignments/")) ||
            (item.href === "/admin/quizzes" && pathname.startsWith("/admin/quizzes/")) ||
            (item.href === "/admin/exams" && pathname.startsWith("/admin/exams/")) ||
            (item.href === "/admin/live-meeting" && pathname.startsWith("/admin/live-meeting/")) ||
            (item.href === "/admin/announcements" && pathname.startsWith("/admin/announcements/")) ||
            (item.href === "/admin/model-answers" && pathname.startsWith("/admin/model-answers/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors",
                "hover:bg-secondary hover:text-foreground",
                isActive && "bg-primary/10 text-primary",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 shrink-0 border-t pt-4">
        <p className="text-xs text-muted-foreground">Signed in as</p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {profile?.fullName ?? "Admin"}
        </p>
        <SignOutButton
          variant="outline"
          className="mt-4 w-full justify-start"
        />
      </div>
    </aside>
  );
}

export function AdminShell({ children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <div className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
          <AdminSidebar />
        </div>

        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="left-0 top-0 h-dvh max-h-dvh w-[min(20rem,calc(100vw-2rem))] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 bg-card p-0 shadow-none sm:w-80 [&>button]:z-10">
            <DialogTitle className="sr-only">Admin navigation</DialogTitle>
            <DialogDescription className="sr-only">
              Primary navigation for admin user management.
            </DialogDescription>
            <AdminSidebar onNavigate={() => setMobileOpen(false)} />
          </DialogContent>
        </Dialog>

        <div className="lg:pl-72">
          <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
              <p className="ml-auto text-sm font-medium text-muted-foreground">
                Admin User Management
              </p>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
