"use client";

import { FileQuestion, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { examSessionLabels } from "../constants";
import { modelAnswerSearchSchema, type ModelAnswerSearchValues } from "../schemas";
import { searchModelAnswer } from "../services/model-answer-service";
import type { ModelAnswer } from "../types";
import { ResourceViewer } from "./resource-viewer";

export function ModelAnswerSearchView() {
  const [result, setResult] = useState<ModelAnswer | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ModelAnswerSearchValues>({
    defaultValues: {
      examYear: new Date().getFullYear(),
      session: "may-june",
      paper: "",
      questionNumber: "",
    },
  });

  async function handleSearch(values: ModelAnswerSearchValues) {
    setSearchError(null);
    setHasSearched(true);

    try {
      const parsedValues = modelAnswerSearchSchema.parse(values);
      const response = await searchModelAnswer(parsedValues);
      setResult(response.modelAnswer);
    } catch (error) {
      setResult(null);
      setSearchError(error instanceof Error ? error.message : "Model answer search failed.");
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Model Answers</p>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
            Find an official mark scheme and teacher solution.
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Search by exam year, session, paper, and question number.
          </p>
        </div>
      </header>

      <Card className="rounded-xl shadow-card">
        <CardHeader>
          <CardTitle>Question search</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-5" onSubmit={handleSubmit(handleSearch)}>
            <div className="space-y-2">
              <label htmlFor="examYear" className="text-sm font-medium">
                Year
              </label>
              <Input id="examYear" type="number" disabled={isSubmitting} {...register("examYear")} />
              {errors.examYear ? (
                <p className="text-sm text-destructive">{errors.examYear.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="session" className="text-sm font-medium">
                Session
              </label>
              <select
                id="session"
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("session")}
              >
                {Object.entries(examSessionLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.session ? (
                <p className="text-sm text-destructive">{errors.session.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="paper" className="text-sm font-medium">
                Paper
              </label>
              <Input id="paper" placeholder="1H" disabled={isSubmitting} {...register("paper")} />
              {errors.paper ? (
                <p className="text-sm text-destructive">{errors.paper.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="questionNumber" className="text-sm font-medium">
                Question
              </label>
              <Input
                id="questionNumber"
                placeholder="9"
                disabled={isSubmitting}
                {...register("questionNumber")}
              />
              {errors.questionNumber ? (
                <p className="text-sm text-destructive">{errors.questionNumber.message}</p>
              ) : null}
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Searching
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" aria-hidden="true" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </form>
          {searchError ? (
            <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {searchError}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="rounded-xl shadow-card">
            <CardHeader>
              <CardTitle>Official Mark Scheme</CardTitle>
            </CardHeader>
            <CardContent>
              <ResourceViewer
                storagePath={result.officialMarkSchemePath}
                type={result.officialMarkSchemeType}
                title={result.officialMarkSchemeFileName}
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-card">
            <CardHeader>
              <CardTitle>Teacher Written Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="min-h-96 rounded-lg border bg-background p-5 text-sm leading-7 text-foreground"
                dangerouslySetInnerHTML={{ __html: result.teacherSolutionHtml }}
              />
            </CardContent>
          </Card>
        </div>
      ) : hasSearched && !searchError ? (
        <EmptyState
          title="No model answer found"
          description="No published solution matches that exact year, session, paper, and question number yet."
          icon={<FileQuestion className="h-10 w-10" aria-hidden="true" />}
        />
      ) : (
        <EmptyState
          title="Search for a question"
          description="Enter the exam details above to view the official mark scheme and teacher written solution."
          icon={<FileQuestion className="h-10 w-10" aria-hidden="true" />}
        />
      )}
    </div>
  );
}
