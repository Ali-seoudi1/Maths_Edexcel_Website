"use client";

import { BarChart3, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ScoreDisplay } from "@/components/shared/score-display";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { getAdminStudentMonthlyReport, getMonthlyReport } from "../services/report-service";
import type { MonthlyReport } from "../types";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: MonthlyReport["items"][number]["status"]) {
  if (status === "on-time") return "On time";
  if (status === "late") return "Late";
  if (status === "opened") return "Opened";
  if (status === "graded") return "Graded";
  if (status === "no-submission") return "No submission";
  return "Submitted";
}

type StudentMonthlyReportViewProps = {
  studentId?: string;
};

export function StudentMonthlyReportView({ studentId }: StudentMonthlyReportViewProps) {
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const request = studentId
      ? getAdminStudentMonthlyReport(studentId, month)
      : getMonthlyReport(month);

    void request
      .then((result) => setReport(result.report))
      .catch((error) => {
        toast({
          title: "Could not load report",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [month, studentId, toast]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Monthly report</h2>
            <p className="mt-1 text-sm text-muted-foreground">Generated automatically from your activity and submissions.</p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="w-44" />
          </div>
        </CardContent>
      </Card>

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Assignments submitted</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.assignmentsSubmitted}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Quizzes submitted</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.quizzesSubmitted}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Late submissions</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.lateSubmissions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">No submissions</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.noSubmissions}</p>
              </CardContent>
            </Card>
          </div>

          {report.items.length === 0 ? (
            <EmptyState
              title="No activity for this month"
              description="Assignments and quiz submissions for the selected month will appear here."
              icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />}
            />
          ) : (
            <div className="space-y-4">
              {report.items.map((item) => (
                <Card key={`${item.type}-${item.id}`}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
                          <Badge
                            variant={
                              item.status === "late"
                                ? "destructive"
                                : item.status === "no-submission"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {statusLabel(item.status)}
                          </Badge>
                          <Badge variant="outline">
                            {item.type === "assignment" ? "Assignment" : item.type === "quiz" ? "Quiz" : "Quiz opened"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{formatDate(item.submittedAt)}</p>
                      </div>
                    </div>
                    {typeof item.score === "number" ? (
                      <ScoreDisplay score={item.score} feedback={item.feedback} />
                    ) : item.feedback ? (
                      <p className="text-sm text-muted-foreground">Feedback: {item.feedback}</p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
