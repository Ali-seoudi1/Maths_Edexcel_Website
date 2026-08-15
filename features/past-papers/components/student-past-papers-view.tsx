"use client";

import { Archive, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { getPastPapersSettings } from "../services/past-papers-service";

export function StudentPastPapersView() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [driveUrl, setDriveUrl] = useState("");

  useEffect(() => {
    void getPastPapersSettings()
      .then((result) => setDriveUrl(result.settings.pastPapersDriveUrl))
      .catch((error) => {
        toast({
          title: "Could not load past papers archive",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return <Skeleton className="mx-auto h-80 max-w-2xl" />;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-2xl shadow-soft">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Archive className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-normal text-foreground">
            Past Papers & MS
          </h1>
          <p className="mt-3 text-base font-medium text-foreground">
            Official Edexcel IGCSE Mathematics Past Papers & Mark Schemes
          </p>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Access the teacher&apos;s Google Drive archive containing official Edexcel IGCSE
            Mathematics past papers and mark schemes organized by year and examination session.
          </p>

          {!driveUrl ? (
            <p className="mt-6 rounded-md border bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
              The teacher has not published the past papers archive yet.
            </p>
          ) : null}

          <Button asChild className="mt-8" size="lg" disabled={!driveUrl}>
            <a href={driveUrl || "#"} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open Past Papers & MS Archive
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
