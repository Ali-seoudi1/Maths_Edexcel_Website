"use client";

import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ScoreDisplay } from "@/components/shared/score-display";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import type { MonthlyReport } from "../types";

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

type MonthlyReportSnapshotViewProps = {
  report: MonthlyReport;
};

/**
 * Read-only renderer for a frozen monthly report snapshot. Used both for the
 * admin publish confirmation and the student's official report history. It never
 * fetches or mutates anything.
 */
export function MonthlyReportSnapshotView({ report }: MonthlyReportSnapshotViewProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Assignments</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.assignmentsSubmitted}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Quizzes &amp; exams</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.quizzesSubmitted}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Late submissions</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.lateSubmissions}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Needs improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">No submissions</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{report.totals.noSubmissions}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Missing work</p>
          </CardContent>
        </Card>
      </div>

      {report.items.length === 0 ? (
        <EmptyState
          title="No activity for this month"
          description="This report was published with no recorded activity for the month."
          icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />}
        />
      ) : (
        <div className="space-y-3">
          {report.items.map((item) => (
            <Card key={`${item.type}-${item.id}`}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                    {item.status === "late" ? (
                      <span className="text-sm font-semibold text-destructive">Late</span>
                    ) : (
                      <Badge variant={item.status === "no-submission" ? "outline" : "secondary"}>
                        {statusLabel(item.status)}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDate(item.submittedAt)}</p>
                </div>
                {typeof item.score === "number" ? (
                  <ScoreDisplay
                    score={item.score}
                    maxScore={item.maxScore ?? 100}
                    feedback={item.feedback}
                    compact
                  />
                ) : item.feedback ? (
                  <p className="text-sm text-muted-foreground">Feedback: {item.feedback}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
