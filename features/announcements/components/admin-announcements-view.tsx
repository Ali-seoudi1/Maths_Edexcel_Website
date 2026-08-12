"use client";

import { Loader2, Megaphone, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  listAdminAnnouncements,
  updateAdminAnnouncement,
} from "../services/announcement-service";
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

export function AdminAnnouncementsView() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [published, setPublished] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);

    try {
      const result = await listAdminAnnouncements();
      setAnnouncements(result.announcements);
    } catch (error) {
      toast({
        title: "Could not load announcements",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  function resetForm() {
    setTitle("");
    setMessage("");
    setPublished(true);
    setEditingId(null);
  }

  async function handleSave() {
    try {
      setSaving(true);
      const values = { title: title.trim(), message: message.trim(), published };

      if (editingId) {
        await updateAdminAnnouncement(editingId, values);
      } else {
        await createAdminAnnouncement(values);
      }

      toast({ title: editingId ? "Announcement updated" : "Announcement posted", variant: "success" });
      resetForm();
      await loadAnnouncements();
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

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      await deleteAdminAnnouncement(id);
      toast({ title: "Announcement deleted", variant: "success" });
      await loadAnnouncements();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{editingId ? "Edit announcement" : "New announcement"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="announcement-title" className="text-sm font-medium text-foreground">
              Title
            </label>
            <Input id="announcement-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label htmlFor="announcement-message" className="text-sm font-medium text-foreground">
              Message
            </label>
            <textarea
              id="announcement-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={7}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <label className="flex items-center gap-3 rounded-lg border bg-secondary/30 p-4 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />
            Published for students
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : editingId ? (
                "Save announcement"
              ) : (
                "Post announcement"
              )}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </>
        ) : announcements.length === 0 ? (
          <EmptyState
            title="No announcements yet"
            description="Post announcements to notify students about assignments, quizzes, deadlines, or revision updates."
            icon={<Megaphone className="h-8 w-8" aria-hidden="true" />}
          />
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{announcement.title}</h2>
                      <Badge variant={announcement.published ? "secondary" : "outline"}>
                        {announcement.published ? "Published" : "Hidden"}
                      </Badge>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{announcement.message}</p>
                    <p className="mt-3 text-xs font-medium text-muted-foreground">
                      Posted {formatDate(announcement.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(announcement.id);
                        setTitle(announcement.title);
                        setMessage(announcement.message);
                        setPublished(announcement.published);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDelete(announcement.id)}
                      disabled={deletingId === announcement.id}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
