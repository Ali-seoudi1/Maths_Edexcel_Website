"use client";

import { CalendarDays, CheckCircle2, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getStudents } from "@/features/admin/students/services/student-service";
import type { Student } from "@/features/admin/students/types";
import { useAuth } from "@/features/auth";

import {
  getAdminReportStatus,
  publishAdminReport,
} from "../services/report-service";
import type { MonthlyReportStatusResult } from "../types";
import { AdminReportAnalytics } from "./admin-report-analytics";
import { MonthlyReportSnapshotView } from "./monthly-report-snapshot-view";
import { StudentMonthlyReportView } from "./student-monthly-report-view";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatDateTime(value: string | null) {
  if (!value) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function monthLabel(period: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(period);

  if (!match) return period;

  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)),
  );
}

export function AdminReportGenerator() {
  const { toast } = useToast();
  const { authReady, profile, status } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [statusResult, setStatusResult] = useState<MonthlyReportStatusResult | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);

  const isAdmin = authReady && status === "authenticated" && profile?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    setStudentsLoading(true);
    void getStudents()
      .then((result) => {
        setStudents(
          [...result.students].sort((a, b) => a.fullName.localeCompare(b.fullName)),
        );
      })
      .catch((error) => {
        toast({
          title: "Could not load students",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setStudentsLoading(false));
  }, [isAdmin, toast]);

  useEffect(() => {
    setShowSnapshot(false);

    if (!isAdmin || !studentId || !/^\d{4}-\d{2}$/.test(month)) {
      setStatusResult(null);
      return;
    }

    let active = true;
    setStatusLoading(true);
    void getAdminReportStatus(studentId, month)
      .then((result) => {
        if (active) {
          setStatusResult(result);
        }
      })
      .catch((error) => {
        if (!active) return;
        setStatusResult(null);
        toast({
          title: "Could not check report status",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (active) setStatusLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin, studentId, month, toast]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.uid === studentId) ?? null,
    [students, studentId],
  );

  const publishedSnapshot =
    statusResult?.status === "published" ? statusResult.snapshot : null;

  async function handlePublish() {
    if (!studentId || !/^\d{4}-\d{2}$/.test(month)) {
      return;
    }

    setPublishing(true);

    try {
      const { snapshot } = await publishAdminReport(studentId, month);
      setStatusResult({ status: "published", period: month, snapshot });
      setShowSnapshot(true);
      toast({
        title: "Report published",
        description: `${monthLabel(month)} report is now official and visible to ${
          selectedStudent?.fullName ?? "the student"
        }.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Report not published",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-5 p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Official Monthly Reports</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a student and month to publish a frozen official snapshot.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="report-student" className="text-sm font-medium text-foreground">
                Student
              </label>
              {studentsLoading ? (
                <Skeleton className="h-10 w-full rounded-md" />
              ) : (
                <select
                  id="report-student"
                  className={selectClassName}
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.uid} value={student.uid}>
                      {student.fullName}
                      {student.active ? "" : " (inactive)"}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="report-month" className="text-sm font-medium text-foreground">
                Month
              </label>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="report-month"
                  type="month"
                  value={month}
                  min="2026-08"
                  onChange={(event) => setMonth(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-secondary/20 p-4">
            {!studentId ? (
              <p className="text-sm text-muted-foreground">
                Select a student and month to check the official report status.
              </p>
            ) : statusLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : statusResult?.status === "published" && publishedSnapshot ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  <Badge variant="secondary">Published</Badge>
                </div>
                <dl className="grid gap-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Period:</dt>
                    <dd className="font-medium text-foreground">{monthLabel(month)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Generated:</dt>
                    <dd className="font-medium text-foreground">
                      {formatDateTime(publishedSnapshot.generatedAt)}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Published:</dt>
                    <dd className="font-medium text-foreground">
                      {formatDateTime(publishedSnapshot.publishedAt)}
                    </dd>
                  </div>
                </dl>
                <p className="text-sm text-muted-foreground">
                  The {monthLabel(month)} report has already been published. It is a fixed historical
                  snapshot and is not overwritten by later activity.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSnapshot((value) => !value)}
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {showSnapshot ? "Hide report" : "View report"}
                </Button>
              </div>
            ) : statusResult?.status === "not_generated" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  <Badge variant="outline">Not generated</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  No official {monthLabel(month)} report exists yet. The student cannot see it.
                  Generating it captures the current activity as a permanent snapshot and notifies the
                  student.
                </p>
                <Button type="button" onClick={() => void handlePublish()} disabled={publishing}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {publishing ? "Publishing…" : "Generate & Publish Report"}
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Current Performance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Private live activity for the selected student. Students cannot see this live report.
          </p>
        </div>
        {studentId ? (
          <StudentMonthlyReportView
            studentId={studentId}
            month={month}
            onMonthChange={setMonth}
          />
        ) : (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                Select a student to view current performance.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Performance Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin-only historical analytics from published monthly report snapshots.
          </p>
        </div>
        <AdminReportAnalytics month={month} />
      </section>

      {showSnapshot && publishedSnapshot ? (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Official {monthLabel(month)} report — {selectedStudent?.fullName ?? "Student"}
          </h2>
          <MonthlyReportSnapshotView report={publishedSnapshot.report} />
        </div>
      ) : null}
    </div>
  );
}
