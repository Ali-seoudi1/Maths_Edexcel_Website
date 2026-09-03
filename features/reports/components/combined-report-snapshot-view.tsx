"use client";

import { BarChart3, CheckCircle2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import type { CombinedOfficialReport, ReportTrendStatus } from "../types";
import { MonthlyReportSnapshotView } from "./monthly-report-snapshot-view";

function formatPercent(value: number | null) {
  return typeof value === "number" ? `${value}%` : "Not available";
}

function formatDelta(value: number | null) {
  if (typeof value !== "number") return "Not enough data";
  if (value > 0) return `+${value} percentage points`;
  return `${value} percentage points`;
}

function periodLabel(period: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(period);

  if (!match) return period;

  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)),
  );
}

function trendLabel(status: ReportTrendStatus) {
  if (status === "improving") return "Improving";
  if (status === "declining") return "Declining";
  if (status === "stable") return "Stable";
  return "Not enough data";
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

type CombinedReportSnapshotViewProps = {
  report: CombinedOfficialReport;
};

export function CombinedReportSnapshotView({ report }: CombinedReportSnapshotViewProps) {
  const trend = report.trend;

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Combined official report</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">{report.student.fullName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {periodLabel(report.fromMonth)} to {periodLabel(report.toMonth)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.periods.map((period) => {
                const isPublished = report.publishedPeriods.includes(period);

                return (
                  <Badge key={period} variant={isPublished ? "secondary" : "outline"}>
                    {isPublished ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                    {periodLabel(period)}
                    {isPublished ? "" : " - No published report"}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Overall performance"
          value={formatPercent(report.overallPerformance)}
          detail="Average across available published months"
        />
        <MetricCard
          label="Completion"
          value={formatPercent(report.completionPercent)}
          detail="Average report completion"
        />
        <MetricCard
          label="On-time"
          value={formatPercent(report.onTimePercent)}
          detail="Average on-time rate"
        />
        <MetricCard
          label="Trend"
          value={trendLabel(trend.status)}
          detail={formatDelta(trend.delta)}
        />
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Performance trend</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Compared from the earliest available published month to the latest available published month.
            </p>
          </div>
          {trend.startPeriod && trend.endPeriod ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-secondary/20 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Starting performance</p>
                <p className="mt-2 font-semibold text-foreground">
                  {periodLabel(trend.startPeriod)} - {formatPercent(trend.startPerformance)}
                </p>
              </div>
              <div className="rounded-xl border bg-secondary/20 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Ending performance</p>
                <p className="mt-2 font-semibold text-foreground">
                  {periodLabel(trend.endPeriod)} - {formatPercent(trend.endPerformance)}
                </p>
              </div>
              <div className="rounded-xl border bg-secondary/20 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Change</p>
                <p className="mt-2 font-semibold text-foreground">{formatDelta(trend.delta)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">At least two published months are needed.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Monthly breakdown</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Missing months are shown as unavailable and are not counted as zero.
            </p>
          </div>
          <div className="grid gap-3">
            {report.monthlyBreakdown.map((month) => (
              <div key={month.period} className="rounded-xl border bg-secondary/20 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-foreground">{periodLabel(month.period)}</h4>
                      <Badge variant={month.status === "published" ? "secondary" : "outline"}>
                        {month.status === "published" ? "Published" : "No published report"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Performance: {formatPercent(month.performancePercent)} | Completion:{" "}
                      {formatPercent(month.completionPercent)} | On-time: {formatPercent(month.onTimePercent)}
                    </p>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-5 lg:text-right">
                    <span>Assignments: {month.assignmentsSubmitted ?? "Not available"}</span>
                    <span>Quizzes: {month.quizzesSubmitted ?? "Not available"}</span>
                    <span>Exams: {month.examsSubmitted ?? "Not available"}</span>
                    <span>Missing: {month.missingCount ?? "Not available"}</span>
                    <span>Late: {month.lateCount ?? "Not available"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Assignments"
          value={String(report.totals.assignmentsSubmitted)}
          detail="Submitted across published months"
        />
        <MetricCard
          label="Quizzes"
          value={String(report.totals.quizzesSubmitted)}
          detail="Completed across published months"
        />
        <MetricCard
          label="Exams"
          value={String(report.totals.examsSubmitted)}
          detail="Completed across published months"
        />
        <MetricCard label="Missing" value={String(report.totals.missingCount)} detail="Missing work" />
        <MetricCard label="Late" value={String(report.totals.lateCount)} detail="Late submissions" />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Monthly report details</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only copies of the published monthly snapshots included in this combined report.
          </p>
        </div>
        {report.monthlyBreakdown.filter((month) => month.report).length === 0 ? (
          <EmptyState
            title="No published monthly reports"
            description="This combined report has no monthly report detail to display."
            icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />}
          />
        ) : (
          report.monthlyBreakdown.map((month) =>
            month.report ? (
              <div key={month.period} className="space-y-3">
                <h4 className="text-base font-semibold text-foreground">{periodLabel(month.period)}</h4>
                <MonthlyReportSnapshotView report={month.report} />
              </div>
            ) : null,
          )
        )}
      </div>
    </div>
  );
}
