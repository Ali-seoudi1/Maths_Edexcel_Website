import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute, RoleGuard } from "@/features/auth";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["student"]}>
        <AppShell>{children}</AppShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}
