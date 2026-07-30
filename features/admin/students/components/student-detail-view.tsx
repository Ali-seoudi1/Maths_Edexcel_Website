"use client";

import { CalendarDays, KeyRound, Mail, Pencil, Trash2, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import type { EditStudentFormValues } from "../schemas";
import { getStudentById } from "../services/student-queries";
import {
  sendStudentPasswordReset,
  softDeleteStudent,
  updateStudent,
} from "../services/student-service";
import type { Student } from "../types";
import { StudentForm } from "./student-form";
import { StudentStatusBadge } from "./student-status-badge";

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="mt-2 break-words text-sm font-medium text-foreground">{value}</div>
        </div>
      </div>
    </div>
  );
}

export function StudentDetailView({ studentId }: { studentId: string }) {
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void getStudentById(studentId)
      .then((nextStudent) => {
        if (isMounted) {
          setStudent(nextStudent);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  async function handleUpdate(values: EditStudentFormValues) {
    if (!student) {
      return;
    }

    try {
      const result = await updateStudent(student.uid, values);
      setStudent(result.student);
      setEditOpen(false);
      toast({
        title: "Student updated",
        description: "Student profile changes were saved.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  async function handlePasswordReset() {
    if (!student) {
      return;
    }

    setBusy(true);

    try {
      await sendStudentPasswordReset(student.email);
      toast({
        title: "Password reset sent",
        description: `A reset email was sent to ${student.email}.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!student) {
      return;
    }

    setBusy(true);

    try {
      const result = await softDeleteStudent(student.uid);
      setStudent(result.student);
      setDeleteOpen(false);
      toast({
        title: "Student disabled",
        description: "Full deletion is a TODO; this soft delete disabled account access.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return (
      <EmptyState
        title="Student not found"
        description="The selected student profile does not exist or is not a student account."
        icon={<UserRound className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{student.fullName}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{student.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void handlePasswordReset()}
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Reset Password
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem icon={UserRound} label="Name" value={student.fullName} />
          <DetailItem icon={Mail} label="Email" value={student.email} />
          <DetailItem icon={UserRound} label="UID" value={student.uid} />
          <DetailItem icon={UserRound} label="Status" value={<StudentStatusBadge active={student.active} />} />
          <DetailItem icon={CalendarDays} label="Created At" value={formatDate(student.createdAt)} />
        </CardContent>
      </Card>

      <Drawer
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit student"
        description="Update profile details and active access status."
      >
        <StudentForm
          mode="edit"
          submitLabel="Save changes"
          defaultValues={{
            fullName: student.fullName,
            email: student.email,
            active: student.active,
          }}
          onSubmit={handleUpdate}
        />
      </Drawer>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete student?</DialogTitle>
            <DialogDescription>
              Full deletion is not implemented yet. This will soft delete the account by disabling
              student access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={() => void handleDelete()}>
              Disable access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
