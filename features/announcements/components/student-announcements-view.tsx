"use client";

import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { listAnnouncements, markAnnouncementsRead } from "../services/announcement-service";
import type { Announcement } from "../types";

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

export function StudentAnnouncementsView() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void listAnnouncements()
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setAnnouncements(result.announcements);
        setLoading(false);
        void markAnnouncementsRead();
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        toast({
          title: "Could not load announcements",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
        setLoading(false);
      })

    return () => {
      isMounted = false;
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <EmptyState
        title="No announcements yet"
        description="Teacher updates about quizzes, assignments, and deadlines will appear here."
        icon={<Megaphone className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <Card key={announcement.id}>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase text-primary">{formatDate(announcement.createdAt)}</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">{announcement.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{announcement.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
