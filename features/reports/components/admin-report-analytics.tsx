"use client";

import { BarChart3, CheckCircle2, ChevronDown, ChevronUp, Search, TrendingDown, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { getAdminReportAnalytics } from "../services/report-service";
import type {
  ReportAnalyticsResult,
  ReportAnalyticsStudent,
  ReportTrendStatus,
} from "../types";
import { MonthlyReportSnapshotView } from "./monthly-report-snapshot-view";

type SortKey = "average" | "completion" | "onTime" | "missing" | "late" | "trend";
type SortDirection = "asc" | "desc";

const trendWeight: Record<ReportTrendStatus, number> = {
  improving: 3,
  stable: 2,
  declining: 1,
  not_enough_data: 0,
};

function formatPercent(value: number | null) {
  return typeof value === "number" ? `${value}%` : "Not available";
}

function formatDelta(value: number | null) {
  if (typeof value !== "number") return "Not enough data";
  if (value > 0) return `+${value} pp`;
  return `${value} pp`;
}

function formatDeltaLong(value: number | null) {
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

function trendEndpointLabel(student: ReportAnalyticsStudent) {
  if (!student.trendStart || !student.trendEnd) {
    return "At least two published months are needed.";
  }

  return `${periodLabel(student.trendStart.period)}: ${formatPercent(
    student.trendStart.performancePercent,
  )} -> ${periodLabel(student.trendEnd.period)}: ${formatPercent(student.trendEnd.performancePercent)}`;
}

function compareNullable(a: number | null, b: number | null) {
  return (a ?? -1) - (b ?? -1);
}

function sortValue(student: ReportAnalyticsStudent, key: SortKey) {
  if (key === "average") return student.averagePerformance;
  if (key === "completion") return student.completionPercent;
  if (key === "onTime") return student.onTimePercent;
  if (key === "missing") return student.missingCount;
  if (key === "late") return student.lateCount;
  return trendWeight[student.trend];
}

function TrendBadge({ student }: { student: ReportAnalyticsStudent }) {
  if (student.trend === "improving") {
    return (
      <Badge variant="secondary">
        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
        {formatDelta(student.trendDelta)}
      </Badge>
    );
  }

  if (student.trend === "declining") {
    return (
      <Badge variant="destructive">
        <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
        {formatDelta(student.trendDelta)}
      </Badge>
    );
  }

  return <Badge variant="outline">{formatDelta(student.trendDelta)}</Badge>;
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
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

type AdminReportAnalyticsProps = {
  month: string;
};

export function AdminReportAnalytics({ month }: AdminReportAnalyticsProps) {
  const { toast } = useToast();
  const [fromMonth, setFromMonth] = useState(month);
  const [toMonth, setToMonth] = useState(month);
  const [analytics, setAnalytics] = useState<ReportAnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("average");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);

  useEffect(() => {
    setFromMonth(month);
    setToMonth(month);
  }, [month]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setOpenStudentId(null);

    void getAdminReportAnalytics(fromMonth, toMonth)
      .then((result) => {
        if (active) {
          setAnalytics(result.analytics);
        }
      })
      .catch((error) => {
        if (!active) return;
        setAnalytics(null);
        toast({
          title: "Could not load performance analytics",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fromMonth, toast, toMonth]);

  const students = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = analytics
      ? analytics.students.filter(
          (student) =>
            student.studentName.toLowerCase().includes(normalizedQuery) ||
            student.studentCode.toLowerCase().includes(normalizedQuery),
        )
      : [];

    return [...filtered].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      const value = compareNullable(sortValue(a, sortKey), sortValue(b, sortKey)) * direction;

      if (value !== 0) return value;
      return a.rank - b.rank;
    });
  }, [analytics, query, sortDirection, sortKey]);
  const openStudent = analytics?.students.find((student) => student.studentId === openStudentId) ?? null;

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "missing" || key === "late" ? "asc" : "desc");
  }

  function SortButton({ label, value }: { label: string; value: SortKey }) {
    const isActive = sortKey === value;
    const Icon = sortDirection === "asc" ? ChevronUp : ChevronDown;

    return (
      <Button type="button" variant="ghost" size="sm" className="-ml-3 gap-1" onClick={() => handleSort(value)}>
        {label}
        {isActive ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      </Button>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Reporting Period</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Historical analytics from published official monthly report snapshots only.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="analytics-from-month" className="text-sm font-medium text-foreground">
                  From month
                </label>
                <Input
                  id="analytics-from-month"
                  type="month"
                  min="2026-08"
                  value={fromMonth}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFromMonth(value);
                    if (value > toMonth) {
                      setToMonth(value);
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="analytics-to-month" className="text-sm font-medium text-foreground">
                  To month
                </label>
                <Input
                  id="analytics-to-month"
                  type="month"
                  min={fromMonth || "2026-08"}
                  value={toMonth}
                  onChange={(event) => setToMonth(event.target.value)}
                />
              </div>
            </div>
          </div>

          {analytics ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border bg-secondary/20 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Selected months</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {analytics.periods.map((period) => (
                    <Badge key={period} variant="outline">
                      {periodLabel(period)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-secondary/20 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Published data</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {analytics.periods.map((period) => {
                    const hasPublishedReports = analytics.publishedPeriods.includes(period);

                    return (
                      <Badge key={period} variant={hasPublishedReports ? "secondary" : "outline"}>
                        {hasPublishedReports ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                        {periodLabel(period)}
                        {hasPublishedReports ? "" : " - No published reports"}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {!analytics || analytics.studentsWithReports === 0 ? (
            <EmptyState
              title="No published reports available for this period."
              description="Publish official reports before reviewing class analytics."
              icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />}
            />
          ) : null}
        </CardContent>
      </Card>

      {analytics && analytics.studentsWithReports > 0 ? (
        <>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Class Overview</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Summary metrics include only students with published report data.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Students with reports"
              value={String(analytics.studentsWithReports)}
              detail={
                analytics.publishedPeriods.length > 0
                  ? analytics.publishedPeriods.map(periodLabel).join(", ")
                  : "No published data"
              }
            />
            <MetricCard
              label="Average performance"
              value={formatPercent(analytics.classAveragePerformance)}
              detail="Average of student aggregates"
            />
            <MetricCard
              label="Average completion"
              value={formatPercent(analytics.averageCompletion)}
              detail="From report item completion"
            />
            <MetricCard
              label="Average on-time"
              value={formatPercent(analytics.averageOnTime)}
              detail="Completed work submitted on time"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Performance Highlights</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Highest performer, strongest improvement, and attention indicators for the selected period.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Highest performer</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {analytics.highestPerformer?.studentName ?? "Not available"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPercent(analytics.highestPerformer?.averagePerformance ?? null)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Most improved</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {analytics.mostImproved?.studentName ?? "Not enough data"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDeltaLong(analytics.mostImproved?.trendDelta ?? null)}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {analytics.mostImproved
                    ? trendEndpointLabel(analytics.mostImproved)
                    : "At least two published months are needed."}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Students needing attention</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {analytics.studentsNeedingAttention.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Transparent threshold-based indicators</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {analytics && analytics.studentsWithReports > 0 ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Student Performance</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ranked by overall performance. Missing published months are ignored, not counted as zero.
                </p>
              </div>
              <div className="relative w-full lg:w-80">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or student ID"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>
                      <SortButton label="Average" value="average" />
                    </TableHead>
                    <TableHead>
                      <SortButton label="Completion" value="completion" />
                    </TableHead>
                    <TableHead>
                      <SortButton label="On-time" value="onTime" />
                    </TableHead>
                    <TableHead>
                      <SortButton label="Missing" value="missing" />
                    </TableHead>
                    <TableHead>
                      <SortButton label="Late" value="late" />
                    </TableHead>
                    <TableHead>
                      <SortButton label="Trend" value="trend" />
                    </TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-semibold text-foreground">{student.rank}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{student.studentName}</p>
                          <p className="text-xs text-muted-foreground">{student.studentCode || student.studentId}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatPercent(student.averagePerformance)}</TableCell>
                      <TableCell>{formatPercent(student.completionPercent)}</TableCell>
                      <TableCell>{formatPercent(student.onTimePercent)}</TableCell>
                      <TableCell>{student.missingCount}</TableCell>
                      <TableCell>{student.lateCount}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <TrendBadge student={student} />
                          <p className="max-w-56 text-xs leading-5 text-muted-foreground">
                            {trendEndpointLabel(student)}
                          </p>
                          <p className="text-xs text-muted-foreground">{trendLabel(student.trend)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpenStudentId(student.studentId)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {students.length === 0 ? (
              <EmptyState
                title="No matching students"
                description="Try another name or student ID."
                icon={<Users className="h-8 w-8" aria-hidden="true" />}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {analytics && analytics.studentsNeedingAttention.length > 0 ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Students needing attention</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on low performance, low completion, missing work, late work, and declining trend.
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {analytics.studentsNeedingAttention.map((student) => (
                <div key={student.studentId} className="rounded-xl border bg-secondary/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{student.studentName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Performance: {formatPercent(student.averagePerformance)} | Completion:{" "}
                        {formatPercent(student.completionPercent)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Missing: {student.missingCount} | Late: {student.lateCount}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {student.attentionReasons.map((reason) => (
                        <Badge key={reason} variant="outline">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={Boolean(openStudent)} onOpenChange={(open) => !open && setOpenStudentId(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{openStudent?.studentName ?? "Student"} performance details</DialogTitle>
            <DialogDescription>Published monthly snapshots included in the selected analytics period.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {openStudent?.snapshots.map((snapshot) => (
              <div key={snapshot.period} className="space-y-3">
                <h3 className="text-base font-semibold text-foreground">
                  {periodLabel(snapshot.period)} published report
                </h3>
                <MonthlyReportSnapshotView report={snapshot.report} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
