"use client";

import { Eye, Pencil, Plus, Search, Trash2, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/features/auth";

import { deleteStudent, getStudents, updateStudent } from "../services/student-service";
import type { EditStudentFormValues } from "../schemas";
import type { Student } from "../types";
import { StudentForm } from "./student-form";
import { StudentStatusBadge } from "./student-status-badge";

const pageSize = 8;
const yearGroups = ["Y9", "Y10", "Y11", "Y12", "Y13"] as const;

function getEditableYearGroup(value: string): (typeof yearGroups)[number] {
  return yearGroups.includes(value as (typeof yearGroups)[number])
    ? (value as (typeof yearGroups)[number])
    : "Y10";
}

function getEditableMathTrack(value: string): "OL" | "AL" {
  return value === "AL" ? "AL" : "OL";
}

function StudentTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card shadow-soft">
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function StudentsTable() {
  const { toast } = useToast();
  const { authReady, profile, status } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToToggle, setStudentToToggle] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [busyStudentId, setBusyStudentId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!authReady || status !== "authenticated" || profile?.role !== "admin") {
      setLoading(true);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);
    void getStudents()
      .then((result) => {
        if (isMounted) {
          setStudents(result.students);
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        toast({
          title: "Could not load students",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
        setStudents([]);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authReady, profile?.role, status, toast]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return students;
    }

    return students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(normalizedQuery) ||
        student.email.toLowerCase().includes(normalizedQuery) ||
        student.studentCode.toLowerCase().includes(normalizedQuery) ||
        student.yearGroup.toLowerCase().includes(normalizedQuery) ||
        student.mathTrack.toLowerCase().includes(normalizedQuery),
    );
  }, [query, students]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const visibleStudents = filteredStudents.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query]);

  async function handleDelete() {
    if (!studentToDelete) {
      return;
    }

    setBusyStudentId(studentToDelete.uid);

    try {
      await deleteStudent(studentToDelete.uid);
      setStudents((items) => items.filter((student) => student.uid !== studentToDelete.uid));
      toast({
        title: "Student deleted",
        description: "The Firebase Auth user and Firestore student profile were deleted.",
        variant: "success",
      });
      setStudentToDelete(null);
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setBusyStudentId(null);
    }
  }

  async function handleToggleActive() {
    if (!studentToToggle) {
      return;
    }

    const student = studentToToggle;
    setBusyStudentId(student.uid);

    try {
      const result = await updateStudent(student.uid, {
        fullName: student.fullName,
        email: student.email,
        yearGroup: getEditableYearGroup(student.yearGroup),
        mathTrack: getEditableMathTrack(student.mathTrack),
        active: !student.active,
      });

      setStudents((items) =>
        items.map((item) => (item.uid === student.uid ? result.student : item)),
      );
      toast({
        title: result.student.active ? "Student reactivated" : "Student deactivated",
        description: result.student.active
          ? "The student can sign in again."
          : "The student can no longer sign in.",
        variant: "success",
      });
      setStudentToToggle(null);
    } catch (error) {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setBusyStudentId(null);
    }
  }

  async function handleEdit(values: EditStudentFormValues) {
    if (!studentToEdit) {
      return;
    }

    setBusyStudentId(studentToEdit.uid);

    try {
      const result = await updateStudent(studentToEdit.uid, values);
      setStudents((items) =>
        items.map((item) => (item.uid === studentToEdit.uid ? result.student : item)),
      );
      toast({
        title: "Student updated",
        description: "The student's details were saved.",
        variant: "success",
      });
      setStudentToEdit(null);
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setBusyStudentId(null);
    }
  }

  if (loading) {
    return <StudentTableSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/admin/students/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New student
          </Link>
        </Button>
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="No students yet"
          description="Create the first student account to begin managing access."
          icon={<Badge variant="secondary">Student</Badge>}
        />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="No matching students"
          description="Try searching by a different name or email address."
          icon={<Search className="h-8 w-8" aria-hidden="true" />}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleStudents.map((student) => (
                  <TableRow key={student.uid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{student.fullName}</p>
                        {student.isTestAccount ? <Badge variant="outline">Test account</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {student.studentCode}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.yearGroup && student.mathTrack ? `${student.yearGroup} / ${student.mathTrack}` : "Not set"}
                    </TableCell>
                    <TableCell>
                      <StudentStatusBadge active={student.active} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="icon" aria-label="View student report">
                          <Link href={`/admin/students/${student.uid}`}>
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={student.active ? "Deactivate student" : "Reactivate student"}
                          disabled={busyStudentId === student.uid}
                          onClick={() => setStudentToToggle(student)}
                        >
                          {student.active ? (
                            <UserX className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <UserCheck className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Edit student"
                          disabled={busyStudentId === student.uid}
                          onClick={() => setStudentToEdit(student)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Delete student"
                          disabled={busyStudentId === student.uid}
                          onClick={() => setStudentToDelete(student)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {filteredStudents.length === 0 ? 0 : (page - 1) * pageSize + 1}-
          {Math.min(page * pageSize, filteredStudents.length)} of {filteredStudents.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(studentToDelete)}
        onOpenChange={(open) => !open && setStudentToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this student?</DialogTitle>
            <DialogDescription>
              This deletes the Firebase Auth user and Firestore student profile. The same email can
              be reused later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStudentToDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={Boolean(busyStudentId)}
              onClick={() => void handleDelete()}
            >
              Delete student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(studentToToggle)}
        onOpenChange={(open) => !open && setStudentToToggle(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {studentToToggle?.active
                ? "Are you sure you want to deactivate this student?"
                : "Are you sure you want to reactivate this student?"}
            </DialogTitle>
            <DialogDescription>
              {studentToToggle?.active
                ? "This will stop the student from signing in until you reactivate the account."
                : "This will allow the student to sign in again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStudentToToggle(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={Boolean(busyStudentId)} onClick={() => void handleToggleActive()}>
              {studentToToggle?.active ? "Deactivate" : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(studentToEdit)}
        onOpenChange={(open) => !open && setStudentToEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
            <DialogDescription>
              Update the student&apos;s profile details and access status.
            </DialogDescription>
          </DialogHeader>
          {studentToEdit ? (
            <StudentForm
              mode="edit"
              submitLabel="Save changes"
              defaultValues={{
                fullName: studentToEdit.fullName,
                email: studentToEdit.email,
                yearGroup: getEditableYearGroup(studentToEdit.yearGroup),
                mathTrack: getEditableMathTrack(studentToEdit.mathTrack),
                active: studentToEdit.active,
              }}
              onSubmit={handleEdit}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
