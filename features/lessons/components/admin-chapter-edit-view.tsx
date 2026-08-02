"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { getAdminChapter } from "../services/lesson-service";
import type { Chapter } from "../types";
import { AdminChapterFormView } from "./admin-chapter-form-view";

export function AdminChapterEditView({ chapterId }: { chapterId: string }) {
  const { toast } = useToast();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getAdminChapter(chapterId)
      .then((result) => setChapter(result.chapter))
      .catch((error) => {
        toast({
          title: "Could not load chapter",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [chapterId, toast]);

  if (loading) {
    return <Skeleton className="h-96 max-w-3xl" />;
  }

  if (!chapter) {
    return <EmptyState title="Chapter not found" description="This chapter could not be loaded." />;
  }

  return <AdminChapterFormView chapter={chapter} />;
}
