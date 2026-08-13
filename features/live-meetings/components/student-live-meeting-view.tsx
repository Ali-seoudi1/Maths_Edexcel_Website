"use client";

import { ExternalLink, Video } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { getStudentLiveMeeting } from "../services/live-meeting-service";
import type { LiveMeeting } from "../types";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StudentLiveMeetingView() {
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<LiveMeeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getStudentLiveMeeting()
      .then((result) => setMeeting(result.meeting))
      .catch((error) => {
        toast({
          title: "Could not load live meeting",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return <Skeleton className="h-52 rounded-2xl" />;
  }

  if (!meeting) {
    return (
      <EmptyState
        title="No live meeting right now"
        description="Your teacher will post the meeting link here when a live class is available."
        icon={<Video className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Video className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground">Live meeting is available</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Posted {formatDate(meeting.updatedAt)}
              </p>
            </div>
          </div>
          <p className="mt-4 break-all text-sm leading-6 text-muted-foreground">{meeting.url}</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <a href={meeting.url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Join meeting
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
