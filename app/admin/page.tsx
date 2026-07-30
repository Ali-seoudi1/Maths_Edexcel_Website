import type { Metadata } from "next";
import { ArrowRight, UsersRound } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/features/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin",
  description: "Protected admin area for the Edexcel Mathematics platform.",
};

export default function AdminPage() {
  return (
    <>
      <AdminPageHeader
        title="Admin"
        description="Manage student access for the Edexcel Mathematics platform."
        breadcrumbs={[{ label: "Admin" }]}
        actions={
          <Button asChild>
            <Link href="/admin/students/new">New student</Link>
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>Student management</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <UsersRound className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Create student accounts, edit profile details, manage active status, and send
                password reset emails. Other admin modules are intentionally not implemented here.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/students">
                Open students
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
