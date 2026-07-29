import type { ReactNode } from "react";

import { ProtectedRoute, RoleGuard } from "@/features/auth";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>
    </ProtectedRoute>
  );
}
