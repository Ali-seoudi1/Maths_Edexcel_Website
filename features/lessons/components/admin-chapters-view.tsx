"use client";

import { Eye, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

import { deleteAdminChapter, listAdminChapters } from "../services/lesson-service";
import type { Chapter } from "../types";

export function AdminChaptersView() {
  const { toast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);

  const loadChapters = useCallback(async () => {
    setLoading(true);

    try {
      const result = await listAdminChapters();
      setChapters(result.chapters);
    } catch (error) {
      toast({
        title: "Could not load topics",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadChapters();
  }, [loadChapters]);

  const filteredChapters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return chapters;
    }

    return chapters.filter(
      (chapter) =>
        chapter.name.toLowerCase().includes(normalizedQuery) ||
        chapter.description.toLowerCase().includes(normalizedQuery),
    );
  }, [chapters, query]);

  async function handleDelete() {
    if (!chapterToDelete) {
      return;
    }

    try {
      await deleteAdminChapter(chapterToDelete.id);
      toast({ title: "Topic deleted", variant: "success" });
      setChapterToDelete(null);
      await loadChapters();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 rounded-lg border bg-card p-4 shadow-soft">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics"
            className="pl-9"
          />
        </div>
      </div>

      {filteredChapters.length === 0 ? (
        <EmptyState
          title="No topics found"
          description="Create topics to organize PDF lessons."
          icon={<Search className="h-8 w-8" aria-hidden="true" />}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChapters.map((chapter) => (
                  <TableRow key={chapter.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{chapter.name}</p>
                      {chapter.description ? (
                        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                          {chapter.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={chapter.published ? "secondary" : "outline"}>
                        {chapter.published ? "Published" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="icon" aria-label="View topic">
                          <Link href={`/admin/chapters/${chapter.id}`}>
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Delete topic"
                          onClick={() => setChapterToDelete(chapter)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={Boolean(chapterToDelete)} onOpenChange={(open) => !open && setChapterToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete topic?</DialogTitle>
            <DialogDescription>
              Topics can only be deleted when no lessons reference them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setChapterToDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
