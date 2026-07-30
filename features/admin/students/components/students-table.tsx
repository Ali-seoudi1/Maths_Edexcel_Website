"use client";

import { Eye, KeyRound, Plus, Search, Trash2 } from "lucide-react";
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

import { sendStudentPasswordReset, softDeleteStudent } from "../services/student-service";
import { subscribeToStudents } from "../services/student-queries";
import type { Student } from "../types";
import { StudentStatusBadge } from "./student-status-badge";

const pageSize = 8;

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
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [busyStudentId, setBusyStudentId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToStudents(
      (nextStudents) => {
        setStudents(nextStudents);
        setLoading(false);
      },
      (error) => {
        toast({
          title: "Could not load students",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [toast]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return students;
    }

    return students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(normalizedQuery) ||
        student.email.toLowerCase().includes(normalizedQuery),
    );
  }, [query, students]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const visibleStudents = filteredStudents.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query]);

  async function handlePasswordReset(student: Student) {
    setBusyStudentId(student.uid);

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
      setBusyStudentId(null);
    }
  }

  async function handleDelete() {
    if (!studentToDelete) {
      return;
    }

    setBusyStudentId(studentToDelete.uid);

    try {
      await softDeleteStudent(studentToDelete.uid);
      toast({
        title: "Student disabled",
        description: "Full deletion is a TODO; this action soft deletes by disabling access.",
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

  if (loading) {
    return <StudentTableSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleStudents.map((student) => (
                  <TableRow key={student.uid}>
                    <TableCell>
                      <p className="font-medium text-foreground">{student.fullName}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {student.uid}
                    </TableCell>
                    <TableCell>
                      <StudentStatusBadge active={student.active} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="icon" aria-label="View student">
                          <Link href={`/admin/students/${student.uid}`}>
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Reset password"
                          disabled={busyStudentId === student.uid}
                          onClick={() => void handlePasswordReset(student)}
                        >
                          <KeyRound className="h-4 w-4" aria-hidden="true" />
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

      <Dialog open={Boolean(studentToDelete)} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete student?</DialogTitle>
            <DialogDescription>
              Full deletion is not implemented yet. This action will soft delete the account by
              disabling student access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStudentToDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()}>
              Disable access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
