"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ErrorStateProps = {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title,
  description,
  retryLabel = "Try again",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-card">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold tracking-normal">{title}</h3>
          {description ? (
            <p className="max-w-md text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
