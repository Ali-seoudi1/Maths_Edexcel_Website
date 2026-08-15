"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ErrorState } from "@/components/shared/error-state";

import { getModelAnswer } from "../services/model-answer-service";
import type { ModelAnswer } from "../types";
import { AdminModelAnswerFormView } from "./admin-model-answer-form-view";

type AdminModelAnswerEditViewProps = {
  modelAnswerId: string;
};

export function AdminModelAnswerEditView({ modelAnswerId }: AdminModelAnswerEditViewProps) {
  const [modelAnswer, setModelAnswer] = useState<ModelAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadModelAnswer() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getModelAnswer(modelAnswerId);

        if (isMounted) {
          setModelAnswer(response.modelAnswer);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error ? loadError.message : "Key question could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadModelAnswer();

    return () => {
      isMounted = false;
    };
  }, [modelAnswerId]);

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-card">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        Loading key question
      </div>
    );
  }

  if (error || !modelAnswer) {
    return (
      <ErrorState
        title="Key question not found"
        description={error ?? "This key question could not be loaded."}
      />
    );
  }

  return <AdminModelAnswerFormView modelAnswer={modelAnswer} />;
}
