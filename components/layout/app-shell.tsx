"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
        <Sidebar />
      </div>

      <Dialog open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <DialogContent className="left-0 top-0 h-dvh max-h-dvh w-[min(20rem,calc(100vw-2rem))] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 bg-sidebar p-0 text-sidebar-foreground shadow-none sm:w-80 [&>button]:z-10 [&>button]:text-sidebar-foreground">
          <DialogTitle className="sr-only">Dashboard navigation</DialogTitle>
          <DialogDescription className="sr-only">
            Primary navigation for the dashboard.
          </DialogDescription>
          <Sidebar onNavigate={() => setIsMobileSidebarOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="lg:pl-72">
        <TopBar onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className={cn("mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
