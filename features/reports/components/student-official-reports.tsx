"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { getPublishedReport, listPublishedReports } from "../services/report-service";
import type { MonthlyReport, MonthlyReportSnapshotSummary } from "../types";
import { MonthlyReportSnapshotView } from "./monthly-report-snapshot-view";

function periodLabel(period: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(period);

  if (!match) return period;

  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)),
  );
}

export function StudentOfficialReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<MonthlyReportSnapshotSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);
  const [openReport, setOpenReport] = useState<MonthlyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    void listPublishedReports()
      .then((result) => setReports(result.reports))
      .catch((error) => {
        toast({
          title: "Could not load official reports",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleToggle(period: string) {
    if (openPeriod === period) {
      setOpenPeriod(null);
      setOpenReport(null);
      return;
    }

    setOpenPeriod(period);
    setOpenReport(null);
    setReportLoading(true);

    try {
      const { snapshot } = await getPublishedReport(period);
      setOpenReport(snapshot.report);
    } catch (error) {
      setOpenPeriod(null);
      toast({
        title: "Could not open report",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setReportLoading(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-28 rounded-2xl" />;
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        title="No reports available yet."
        description="Your teacher will publish your progress reports here."
        icon={<FileText className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const isOpen = openPeriod === report.period;

        return (
          <Card key={report.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {periodLabel(report.period)}
                  </h3>
                  <Badge variant="secondary">Published</Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleToggle(report.period)}
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {isOpen ? "Hide report" : "View report"}
                </Button>
              </div>

              {isOpen ? (
                reportLoading ? (
                  <Skeleton className="h-40 rounded-2xl" />
                ) : openReport ? (
                  <MonthlyReportSnapshotView report={openReport} />
                ) : null
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
