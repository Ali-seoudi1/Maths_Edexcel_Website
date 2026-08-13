"use client";

import { ExternalLink, Loader2, Trash2, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import {
  clearAdminLiveMeeting,
  getAdminLiveMeeting,
  saveAdminLiveMeeting,
} from "../services/live-meeting-service";
import type { LiveMeeting } from "../types";

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

export function AdminLiveMeetingView() {
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<LiveMeeting | null>(null);
  const [url, setUrl] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadMeeting = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getAdminLiveMeeting();
      setMeeting(result.meeting);
      setUrl(result.meeting?.url ?? "");
      setActive(result.meeting?.active ?? true);
    } catch (error) {
      toast({
        title: "Could not load live meeting",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadMeeting();
  }, [loadMeeting]);

  async function handleSave() {
    try {
      setSaving(true);
      const result = await saveAdminLiveMeeting({ url: url.trim(), active });
      setMeeting(result.meeting);
      setUrl(result.meeting.url);
      setActive(result.meeting.active);
      toast({ title: "Live meeting saved", variant: "success" });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    try {
      setClearing(true);
      await clearAdminLiveMeeting();
      setMeeting(null);
      setUrl("");
      setActive(true);
      toast({ title: "Live meeting cleared", variant: "success" });
    } catch (error) {
      toast({
        title: "Clear failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Meeting link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="meeting-url" className="text-sm font-medium text-foreground">
              Meeting URL
            </label>
            <Input
              id="meeting-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
            />
          </div>
          <label className="flex items-center gap-3 rounded-lg border bg-secondary/30 p-4 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Show this meeting to students
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                "Save meeting"
              )}
            </Button>
            {meeting ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleClear()}
                disabled={clearing}
              >
                {clearing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Clear
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {meeting ? (
        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">Current live meeting</h2>
                  <Badge variant={meeting.active ? "secondary" : "outline"}>
                    {meeting.active ? "Visible to students" : "Hidden"}
                  </Badge>
                </div>
                <p className="mt-2 break-all text-sm leading-6 text-muted-foreground">{meeting.url}</p>
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  Updated {formatDate(meeting.updatedAt)}
                </p>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <a href={meeting.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Open
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No live meeting link"
          description="Save a meeting URL when students need to join a live class."
          icon={<Video className="h-8 w-8" aria-hidden="true" />}
        />
      )}
    </div>
  );
}
