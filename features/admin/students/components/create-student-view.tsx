"use client";

import { Copy, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

import { createStudent } from "../services/student-service";
import type { StudentFormValues } from "../schemas";
import type { CreateStudentResponse } from "../types";
import { StudentForm } from "./student-form";

export function CreateStudentView() {
  const router = useRouter();
  const { toast } = useToast();
  const [createdStudent, setCreatedStudent] = useState<CreateStudentResponse | null>(null);

  async function handleCreate(values: StudentFormValues) {
    try {
      const result = await createStudent(values);
      setCreatedStudent(result);
      toast({
        title: "Student created",
        description: `${result.student.fullName} can now sign in with the temporary password.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Student was not created",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  async function copyTemporaryPassword() {
    if (!createdStudent) {
      return;
    }

    await navigator.clipboard.writeText(createdStudent.temporaryPassword);
    toast({
      title: "Temporary password copied",
      description: "Share it securely with the student.",
      variant: "success",
    });
  }

  return (
    <>
      <Card className="max-w-3xl shadow-soft">
        <CardHeader>
          <CardTitle>Student details</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm mode="create" submitLabel="Create student" onSubmit={handleCreate} />
        </CardContent>
      </Card>

      <Dialog open={Boolean(createdStudent)} onOpenChange={(open) => !open && router.push("/admin/students")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student account created</DialogTitle>
            <DialogDescription>
              Save this temporary password now. It is only shown once.
            </DialogDescription>
          </DialogHeader>
          {createdStudent ? (
            <div className="space-y-5">
              <div className="rounded-md border bg-secondary/60 p-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {createdStudent.student.email}
                    </p>
                    <p className="mt-1 font-mono text-sm text-muted-foreground">
                      {createdStudent.temporaryPassword}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => void copyTemporaryPassword()}>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy password
                </Button>
                <Button type="button" onClick={() => router.push("/admin/students")}>
                  Done
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
