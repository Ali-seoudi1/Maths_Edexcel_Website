import type { Metadata } from "next";

import { AdminSignOutButton } from "./admin-sign-out-button";

export const metadata: Metadata = {
  title: "Admin",
  description: "Protected admin area for the Edexcel Mathematics platform.",
};

export default function AdminPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-2xl rounded-lg border bg-card p-8 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
          Admin area
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Authentication and role protection are active. Admin dashboard features will be built
          separately.
        </p>
        <div className="mt-6">
          <AdminSignOutButton />
        </div>
      </div>
    </main>
  );
}
