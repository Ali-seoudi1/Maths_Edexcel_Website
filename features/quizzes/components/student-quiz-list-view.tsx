"use client";

import { Clock3, FileQuestion } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { listQuizzes } from "../services/quiz-service";
import type { Quiz } from "../types";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StudentQuizListView() {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listQuizzes()
      .then((result) => setQuizzes(result.quizzes))
      .catch((error) => {
        toast({
          title: "Could not load quizzes",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return <Skeleton className="h-48" />;
  }

  if (quizzes.length === 0) {
    return (
      <EmptyState
        title="No quizzes available"
        description="Your teacher has not published any quizzes yet."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => (
        <Card key={quiz.id} className="shadow-soft">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">{quiz.title}</h2>
                <Badge variant={quiz.status === "closed" ? "outline" : "secondary"}>
                  {quiz.status === "closed" ? "Closed" : "Active"}
                </Badge>
              </div>
              {quiz.description ? <p className="text-sm text-muted-foreground">{quiz.description}</p> : null}
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {quiz.durationMinutes} minutes · closes {formatDate(quiz.expiresAt)}
              </div>
            </div>
            <Button asChild>
              <Link href={`/quizzes/${quiz.id}`}>Open quiz</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
