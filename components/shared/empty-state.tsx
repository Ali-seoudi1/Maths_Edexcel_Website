"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="rounded-2xl border-dashed bg-card/90 shadow-soft">
      <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        {icon ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
        ) : null}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold tracking-normal">{title}</h3>
          {description ? (
            <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actionLabel && onAction ? (
          <Button type="button" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
