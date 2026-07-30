import type { ReactNode } from "react";

import { AdminShell } from "@/features/admin";
import { ProtectedRoute, RoleGuard } from "@/features/auth";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["admin"]}>
        <AdminShell>{children}</AdminShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}
