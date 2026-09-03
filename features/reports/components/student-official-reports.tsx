"use client";

import { CalendarRange, Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import {
  getPublishedCombinedReport,
  getPublishedReport,
  downloadPublishedCombinedReportPdf,
  downloadPublishedMonthlyReportPdf,
  listPublishedCombinedReports,
  listPublishedReports,
} from "../services/report-service";
import type { CombinedReportSnapshot, CombinedReportSummary, MonthlyReport, MonthlyReportSnapshotSummary } from "../types";
import { CombinedReportSnapshotView } from "./combined-report-snapshot-view";
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
  const [combinedReports, setCombinedReports] = useState<CombinedReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);
  const [openReport, setOpenReport] = useState<MonthlyReport | null>(null);
  const [openCombinedId, setOpenCombinedId] = useState<string | null>(null);
  const [openCombinedReport, setOpenCombinedReport] = useState<CombinedReportSnapshot | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    void Promise.all([listPublishedReports(), listPublishedCombinedReports()])
      .then(([monthlyResult, combinedResult]) => {
        setReports(monthlyResult.reports);
        setCombinedReports(combinedResult.reports);
      })
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
    setOpenCombinedId(null);
    setOpenCombinedReport(null);
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

  async function handleCombinedToggle(reportId: string) {
    if (openCombinedId === reportId) {
      setOpenCombinedId(null);
      setOpenCombinedReport(null);
      return;
    }

    setOpenCombinedId(reportId);
    setOpenPeriod(null);
    setOpenReport(null);
    setOpenCombinedReport(null);
    setReportLoading(true);

    try {
      const { snapshot } = await getPublishedCombinedReport(reportId);
      setOpenCombinedReport(snapshot);
    } catch (error) {
      setOpenCombinedId(null);
      toast({
        title: "Could not open combined report",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setReportLoading(false);
    }
  }

  async function handleDownloadMonthlyPdf(period: string) {
    const downloadId = `monthly:${period}`;
    setDownloadingReportId(downloadId);

    try {
      await downloadPublishedMonthlyReportPdf(period);
      toast({
        title: "PDF downloaded",
        description: `${periodLabel(period)} report was downloaded.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "PDF not downloaded",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReportId(null);
    }
  }

  async function handleDownloadCombinedPdf(report: CombinedReportSummary) {
    const downloadId = `combined:${report.id}`;
    setDownloadingReportId(downloadId);

    try {
      await downloadPublishedCombinedReportPdf(report.id);
      toast({
        title: "PDF downloaded",
        description: `${periodLabel(report.fromMonth)} to ${periodLabel(report.toMonth)} report was downloaded.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "PDF not downloaded",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReportId(null);
    }
  }

  if (loading) {
    return <Skeleton className="h-28 rounded-2xl" />;
  }

  if (reports.length === 0 && combinedReports.length === 0) {
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
      {combinedReports.map((report) => {
        const isOpen = openCombinedId === report.id;

        return (
          <Card key={report.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {periodLabel(report.fromMonth)} to {periodLabel(report.toMonth)}
                  </h3>
                  <Badge variant="secondary">Published</Badge>
                  <Badge variant="outline">Combined report</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCombinedToggle(report.id)}
                  >
                    <CalendarRange className="h-4 w-4" aria-hidden="true" />
                    {isOpen ? "Hide report" : "View report"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDownloadCombinedPdf(report)}
                    disabled={downloadingReportId === `combined:${report.id}`}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {downloadingReportId === `combined:${report.id}` ? "Downloading..." : "Download PDF"}
                  </Button>
                </div>
              </div>

              {isOpen ? (
                reportLoading ? (
                  <Skeleton className="h-40 rounded-2xl" />
                ) : openCombinedReport ? (
                  <CombinedReportSnapshotView report={openCombinedReport.report} />
                ) : null
              ) : null}
            </CardContent>
          </Card>
        );
      })}

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
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleToggle(report.period)}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    {isOpen ? "Hide report" : "View report"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDownloadMonthlyPdf(report.period)}
                    disabled={downloadingReportId === `monthly:${report.period}`}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {downloadingReportId === `monthly:${report.period}` ? "Downloading..." : "Download PDF"}
                  </Button>
                </div>
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
