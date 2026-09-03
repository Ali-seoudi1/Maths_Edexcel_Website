"use client";

import { CalendarDays, CheckCircle2, Download, FileText, Layers3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getStudents } from "@/features/admin/students/services/student-service";
import type { Student } from "@/features/admin/students/types";
import { useAuth } from "@/features/auth";

import {
  deleteAdminCombinedReportDraft,
  deleteAdminReportDraft,
  downloadAdminCombinedReportPdf,
  downloadAdminMonthlyReportPdf,
  generateAdminCombinedReport,
  generateAdminReportDraft,
  getAdminCombinedReportStatus,
  getAdminReportStatus,
  publishAdminCombinedReport,
  publishAdminReport,
} from "../services/report-service";
import type { CombinedReportSnapshot, MonthlyReportStatusResult } from "../types";
import { AdminReportAnalytics } from "./admin-report-analytics";
import { CombinedReportSnapshotView } from "./combined-report-snapshot-view";
import { MonthlyReportSnapshotView } from "./monthly-report-snapshot-view";
import { StudentMonthlyReportView } from "./student-monthly-report-view";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type ReportsTab = "analytics" | "current" | "official" | "combined";

const tabs: Array<{ value: ReportsTab; label: string; description: string }> = [
  {
    value: "current",
    label: "Current Performance",
    description: "Private live performance for one student.",
  },
  {
    value: "analytics",
    label: "Performance Analytics",
    description: "Historical class and student analytics.",
  },
  {
    value: "official",
    label: "Official Reports",
    description: "Teacher-published monthly snapshots.",
  },
  {
    value: "combined",
    label: "Combined Reports",
    description: "Multi-month report generation.",
  },
];

function isReportsTab(value: string | null): value is ReportsTab {
  return value === "analytics" || value === "current" || value === "official" || value === "combined";
}

function initialReportsTab(): ReportsTab {
  if (typeof window === "undefined") {
    return "analytics";
  }

  const tab = new URLSearchParams(window.location.search).get("tab");

  return isReportsTab(tab) ? tab : "analytics";
}

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

function selectedMonths(fromMonth: string, toMonth: string) {
  if (!/^\d{4}-\d{2}$/.test(fromMonth) || !/^\d{4}-\d{2}$/.test(toMonth) || fromMonth > toMonth) {
    return [];
  }

  const months = [fromMonth];

  while (months[months.length - 1] < toMonth) {
    const [year, monthValue] = months[months.length - 1].split("-").map(Number);
    const date = new Date(Date.UTC(year, monthValue, 1));
    months.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  return months;
}

function SectionIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

type StudentSelectProps = {
  id: string;
  value: string;
  students: Student[];
  loading: boolean;
  onChange: (value: string) => void;
};

function StudentSelect({ id, value, students, loading, onChange }: StudentSelectProps) {
  if (loading) {
    return <Skeleton className="h-10 w-full rounded-md" />;
  }

  return (
    <select id={id} className={selectClassName} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select a student</option>
      {students.map((student) => (
        <option key={student.uid} value={student.uid}>
          {student.fullName}
          {student.active ? "" : " (inactive)"}
        </option>
      ))}
    </select>
  );
}

export function AdminReportGenerator() {
  const { toast } = useToast();
  const { authReady, profile, status } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportsTab>(initialReportsTab);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [statusResult, setStatusResult] = useState<MonthlyReportStatusResult | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [generatingMonthly, setGeneratingMonthly] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deletingMonthly, setDeletingMonthly] = useState(false);
  const [downloadingMonthly, setDownloadingMonthly] = useState(false);
  const [monthlyViewerOpen, setMonthlyViewerOpen] = useState(false);
  const [monthlyDeleteOpen, setMonthlyDeleteOpen] = useState(false);
  const [combinedFromMonth, setCombinedFromMonth] = useState(month);
  const [combinedToMonth, setCombinedToMonth] = useState(month);
  const [combinedReport, setCombinedReport] = useState<CombinedReportSnapshot | null>(null);
  const [combinedViewerOpen, setCombinedViewerOpen] = useState(false);
  const [combinedDeleteOpen, setCombinedDeleteOpen] = useState(false);
  const [combinedStatusLoading, setCombinedStatusLoading] = useState(false);
  const [generatingCombined, setGeneratingCombined] = useState(false);
  const [publishingCombined, setPublishingCombined] = useState(false);
  const [deletingCombined, setDeletingCombined] = useState(false);
  const [downloadingCombined, setDownloadingCombined] = useState(false);

  const isAdmin = authReady && status === "authenticated" && profile?.role === "admin";

  function handleTabChange(tab: ReportsTab) {
    setActiveTab(tab);

    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  }

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    setStudentsLoading(true);
    void getStudents()
      .then((result) => {
        setStudents([...result.students].sort((a, b) => a.fullName.localeCompare(b.fullName)));
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
    setMonthlyViewerOpen(false);

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

  const combinedSelectedMonths = selectedMonths(combinedFromMonth, combinedToMonth);

  useEffect(() => {
    setCombinedReport(null);
    setCombinedViewerOpen(false);

    if (!isAdmin || !studentId || combinedSelectedMonths.length === 0) {
      return;
    }

    let active = true;
    setCombinedStatusLoading(true);

    void getAdminCombinedReportStatus(studentId, combinedFromMonth, combinedToMonth)
      .then((result) => {
        if (!active) return;
        setCombinedReport(result.status === "not_generated" ? null : result.snapshot);
      })
      .catch((error) => {
        if (!active) return;
        setCombinedReport(null);
        toast({
          title: "Could not check combined report status",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (active) setCombinedStatusLoading(false);
      });

    return () => {
      active = false;
    };
  }, [combinedFromMonth, combinedSelectedMonths.length, combinedToMonth, isAdmin, studentId, toast]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.uid === studentId) ?? null,
    [students, studentId],
  );
  const publishedSnapshot = statusResult?.status === "published" ? statusResult.snapshot : null;
  const monthlySnapshot =
    statusResult?.status === "draft" || statusResult?.status === "published" ? statusResult.snapshot : null;

  async function handleGenerateMonthlyDraft() {
    if (!studentId || !/^\d{4}-\d{2}$/.test(month)) {
      return;
    }

    setGeneratingMonthly(true);

    try {
      const { snapshot, alreadyExists } = await generateAdminReportDraft(studentId, month);
      setStatusResult({ status: snapshot.status, period: month, snapshot });
      setMonthlyViewerOpen(true);
      toast({
        title: alreadyExists ? "Report already exists" : "Report draft generated",
        description:
          snapshot.status === "published"
            ? `${monthLabel(month)} report is already published.`
            : "The draft was saved. It is not visible to the student yet.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Report draft not generated",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setGeneratingMonthly(false);
    }
  }

  async function handlePublish() {
    if (!studentId || !/^\d{4}-\d{2}$/.test(month)) {
      return;
    }

    setPublishing(true);

    try {
      const { snapshot, alreadyPublished } = await publishAdminReport(studentId, month);
      setStatusResult({ status: "published", period: month, snapshot });
      setMonthlyViewerOpen(true);
      toast({
        title: alreadyPublished ? "Report already published" : "Report published",
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

  async function handleDeleteMonthlyDraft() {
    if (!studentId || !/^\d{4}-\d{2}$/.test(month)) return;

    setDeletingMonthly(true);

    try {
      await deleteAdminReportDraft(studentId, month);
      setStatusResult({ status: "not_generated", period: month });
      setMonthlyViewerOpen(false);
      setMonthlyDeleteOpen(false);
      toast({
        title: "Draft deleted",
        description: "The monthly report draft was removed. The student was not notified.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Draft not deleted",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDeletingMonthly(false);
    }
  }

  async function handleDownloadMonthlyPdf() {
    if (!studentId || !/^\d{4}-\d{2}$/.test(month) || !publishedSnapshot) return;

    setDownloadingMonthly(true);

    try {
      await downloadAdminMonthlyReportPdf(studentId, month);
      toast({
        title: "PDF downloaded",
        description: `${monthLabel(month)} report was downloaded.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "PDF not downloaded",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDownloadingMonthly(false);
    }
  }

  async function handleGenerateCombinedReport() {
    if (!studentId || !/^\d{4}-\d{2}$/.test(combinedFromMonth) || !/^\d{4}-\d{2}$/.test(combinedToMonth)) {
      return;
    }

    setGeneratingCombined(true);

    try {
      const { snapshot, alreadyExists } = await generateAdminCombinedReport(studentId, combinedFromMonth, combinedToMonth);
      setCombinedReport(snapshot);
      toast({
        title: alreadyExists ? "Combined report already exists" : "Combined report ready for review",
        description:
          snapshot.status === "published"
            ? "This combined report is already published."
            : "The report was generated as a draft. It is not visible to the student yet.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Combined report not generated",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setGeneratingCombined(false);
    }
  }

  async function handlePublishCombinedReport() {
    if (!combinedReport) return;

    setPublishingCombined(true);

    try {
      const { snapshot, alreadyPublished } = await publishAdminCombinedReport(combinedReport.id);
      setCombinedReport(snapshot);
      toast({
        title: alreadyPublished ? "Combined report already published" : "Combined report published",
        description: `${monthLabel(snapshot.fromMonth)} to ${monthLabel(snapshot.toMonth)} is now visible to ${
          selectedStudent?.fullName ?? "the student"
        }.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Combined report not published",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setPublishingCombined(false);
    }
  }

  async function handleDeleteCombinedDraft() {
    if (!combinedReport) return;

    setDeletingCombined(true);

    try {
      await deleteAdminCombinedReportDraft(combinedReport.id);
      setCombinedReport(null);
      setCombinedViewerOpen(false);
      setCombinedDeleteOpen(false);
      toast({
        title: "Combined draft deleted",
        description: "The combined report draft was removed. The student was not notified.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Combined draft not deleted",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDeletingCombined(false);
    }
  }

  async function handleDownloadCombinedPdf() {
    if (!combinedReport || combinedReport.status !== "published") return;

    setDownloadingCombined(true);

    try {
      await downloadAdminCombinedReportPdf(combinedReport.id);
      toast({
        title: "PDF downloaded",
        description: "The combined report was downloaded.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "PDF not downloaded",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDownloadingCombined(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-2">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  className={cn(
                    "min-w-[190px] rounded-lg px-4 py-3 text-left transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
                  )}
                  onClick={() => handleTabChange(tab.value)}
                >
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className={cn("mt-1 block text-xs", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {activeTab === "analytics" ? (
        <section className="space-y-4">
          <SectionIntro
            title="Performance Analytics"
            description="Historical analytics from published official monthly report snapshots."
          />
          <AdminReportAnalytics month={month} />
        </section>
      ) : null}

      {activeTab === "current" ? (
        <section className="space-y-4">
          <SectionIntro title="Current Performance" description="Private live performance for the selected student." />
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="current-report-student" className="text-sm font-medium text-foreground">
                    Student
                  </label>
                  <StudentSelect
                    id="current-report-student"
                    value={studentId}
                    students={students}
                    loading={studentsLoading}
                    onChange={setStudentId}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="current-report-month" className="text-sm font-medium text-foreground">
                    Month
                  </label>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="current-report-month"
                      type="month"
                      value={month}
                      min="2026-08"
                      onChange={(event) => setMonth(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {studentId ? (
            <StudentMonthlyReportView studentId={studentId} month={month} onMonthChange={setMonth} />
          ) : (
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Select a student to view current performance.</p>
              </CardContent>
            </Card>
          )}
        </section>
      ) : null}

      {activeTab === "official" ? (
        <section className="space-y-4">
          <SectionIntro
            title="Official Monthly Reports"
            description="Choose a student and month to publish a frozen official monthly report."
          />
          <Card>
            <CardContent className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="official-report-student" className="text-sm font-medium text-foreground">
                    Student
                  </label>
                  <StudentSelect
                    id="official-report-student"
                    value={studentId}
                    students={students}
                    loading={studentsLoading}
                    onChange={setStudentId}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="official-report-month" className="text-sm font-medium text-foreground">
                    Month
                  </label>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="official-report-month"
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
                ) : statusResult?.status === "draft" && monthlySnapshot ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Status:</span>
                      <Badge variant="outline">Draft</Badge>
                    </div>
                    <dl className="grid gap-1 text-sm">
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">Period:</dt>
                        <dd className="font-medium text-foreground">{monthLabel(month)}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">Generated:</dt>
                        <dd className="font-medium text-foreground">{formatDateTime(monthlySnapshot.generatedAt)}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">Generated by:</dt>
                        <dd className="font-medium text-foreground">{monthlySnapshot.generatedBy || "Admin"}</dd>
                      </div>
                    </dl>
                    <p className="text-sm text-muted-foreground">
                      This draft is saved in Firestore. The student cannot see it until you publish it.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setMonthlyViewerOpen(true)}>
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        View report
                      </Button>
                      <Button type="button" size="sm" onClick={() => void handlePublish()} disabled={publishing}>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {publishing ? "Publishing..." : "Publish to Student"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setMonthlyDeleteOpen(true)}
                      >
                        Delete Draft
                      </Button>
                    </div>
                  </div>
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
                        <dd className="font-medium text-foreground">{formatDateTime(publishedSnapshot.generatedAt)}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">Generated by:</dt>
                        <dd className="font-medium text-foreground">{publishedSnapshot.generatedBy || "Admin"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">Published:</dt>
                        <dd className="font-medium text-foreground">{formatDateTime(publishedSnapshot.publishedAt)}</dd>
                      </div>
                    </dl>
                    <p className="text-sm text-muted-foreground">
                      The {monthLabel(month)} report has already been published. It is a fixed historical snapshot and is
                      not overwritten by later activity.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setMonthlyViewerOpen(true)}>
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        View report
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleDownloadMonthlyPdf()}
                        disabled={downloadingMonthly}
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        {downloadingMonthly ? "Downloading..." : "Download PDF"}
                      </Button>
                    </div>
                  </div>
                ) : statusResult?.status === "not_generated" ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Status:</span>
                      <Badge variant="outline">Not generated</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No official {monthLabel(month)} report exists yet. Generate a draft to review it before publishing.
                    </p>
                    <Button type="button" onClick={() => void handleGenerateMonthlyDraft()} disabled={generatingMonthly}>
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      {generatingMonthly ? "Generating..." : "Generate Report"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {activeTab === "combined" ? (
        <section className="space-y-4">
          <SectionIntro
            title="Combined Official Reports"
            description="Generate one report from published monthly report snapshots for the selected student."
          />
          <Card>
            <CardContent className="space-y-5 p-5">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="combined-report-student" className="text-sm font-medium text-foreground">
                    Student
                  </label>
                  <StudentSelect
                    id="combined-report-student"
                    value={studentId}
                    students={students}
                    loading={studentsLoading}
                    onChange={setStudentId}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="combined-from-month" className="text-sm font-medium text-foreground">
                    From month
                  </label>
                  <Input
                    id="combined-from-month"
                    type="month"
                    min="2026-08"
                    value={combinedFromMonth}
                    onChange={(event) => {
                      const value = event.target.value;
                      setCombinedFromMonth(value);
                      if (value > combinedToMonth) {
                        setCombinedToMonth(value);
                      }
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="combined-to-month" className="text-sm font-medium text-foreground">
                    To month
                  </label>
                  <Input
                    id="combined-to-month"
                    type="month"
                    min={combinedFromMonth || "2026-08"}
                    value={combinedToMonth}
                    onChange={(event) => setCombinedToMonth(event.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-xl border bg-secondary/20 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Selected months</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {combinedSelectedMonths.length > 0 ? (
                    combinedSelectedMonths.map((selectedMonth) => (
                      <Badge key={selectedMonth} variant="outline">
                        {monthLabel(selectedMonth)}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Choose a valid complete-month range.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Generate creates a draft only. The student will not see it until you publish.
                </p>
                <Button
                  type="button"
                  onClick={() => void handleGenerateCombinedReport()}
                  disabled={!studentId || generatingCombined || combinedSelectedMonths.length === 0}
                >
                  <Layers3 className="h-4 w-4" aria-hidden="true" />
                  {generatingCombined ? "Generating..." : "Generate Report"}
                </Button>
              </div>

              {combinedStatusLoading ? (
                <Skeleton className="h-32 rounded-2xl" />
              ) : combinedReport ? (
                <div className="rounded-xl border bg-secondary/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">Combined report ready</h3>
                        <Badge variant={combinedReport.status === "published" ? "secondary" : "outline"}>
                          {combinedReport.status}
                        </Badge>
                      </div>
                      <dl className="mt-3 grid gap-1 text-sm">
                        <div className="flex gap-2">
                          <dt className="text-muted-foreground">Student:</dt>
                          <dd className="font-medium text-foreground">{combinedReport.report.student.fullName}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="text-muted-foreground">Period:</dt>
                          <dd className="font-medium text-foreground">
                            {monthLabel(combinedReport.fromMonth)} to {monthLabel(combinedReport.toMonth)}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="text-muted-foreground">Generated:</dt>
                          <dd className="font-medium text-foreground">{formatDateTime(combinedReport.generatedAt)}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="text-muted-foreground">Generated by:</dt>
                          <dd className="font-medium text-foreground">{combinedReport.generatedBy || "Admin"}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="text-muted-foreground">Months included:</dt>
                          <dd className="font-medium text-foreground">
                            {combinedReport.publishedPeriods.map(monthLabel).join(", ")}
                          </dd>
                        </div>
                        {combinedReport.missingPeriods.length > 0 ? (
                          <div className="flex gap-2">
                            <dt className="text-muted-foreground">No published report:</dt>
                            <dd className="font-medium text-foreground">
                              {combinedReport.missingPeriods.map(monthLabel).join(", ")}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setCombinedViewerOpen(true)}>
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        View report
                      </Button>
                      {combinedReport.status === "published" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleDownloadCombinedPdf()}
                          disabled={downloadingCombined}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                          {downloadingCombined ? "Downloading..." : "Download PDF"}
                        </Button>
                      ) : null}
                      {combinedReport.status === "draft" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handlePublishCombinedReport()}
                          disabled={publishingCombined}
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          {publishingCombined ? "Publishing..." : "Publish to Student"}
                        </Button>
                      ) : null}
                      {combinedReport.status === "draft" ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setCombinedDeleteOpen(true)}
                        >
                          Delete Draft
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border bg-secondary/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant="outline">Not generated</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    No combined report exists for this student and period yet. Generate a draft to review it before
                    publishing.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <Dialog open={monthlyViewerOpen} onOpenChange={setMonthlyViewerOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              Official {monthLabel(month)} report - {selectedStudent?.fullName ?? "Student"}
            </DialogTitle>
            <DialogDescription>Read-only monthly report snapshot.</DialogDescription>
          </DialogHeader>
          {monthlySnapshot ? <MonthlyReportSnapshotView report={monthlySnapshot.report} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={combinedViewerOpen} onOpenChange={setCombinedViewerOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Combined report review</DialogTitle>
            <DialogDescription>
              Read-only combined report generated from published monthly report snapshots.
            </DialogDescription>
          </DialogHeader>
          {combinedReport ? <CombinedReportSnapshotView report={combinedReport.report} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={monthlyDeleteOpen} onOpenChange={setMonthlyDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this draft?</DialogTitle>
            <DialogDescription>
              Any unsaved draft report data for {monthLabel(month)} will be permanently removed. You can generate it
              again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMonthlyDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleDeleteMonthlyDraft()} disabled={deletingMonthly}>
              {deletingMonthly ? "Deleting..." : "Delete Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={combinedDeleteOpen} onOpenChange={setCombinedDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this draft?</DialogTitle>
            <DialogDescription>
              Any unsaved combined draft report data for {monthLabel(combinedFromMonth)} to {monthLabel(combinedToMonth)}
              will be permanently removed. You can generate it again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCombinedDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDeleteCombinedDraft()}
              disabled={deletingCombined}
            >
              {deletingCombined ? "Deleting..." : "Delete Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
