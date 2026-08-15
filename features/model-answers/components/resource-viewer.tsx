"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { getStorageDownloadUrl } from "../services/model-answer-service";
import type { OfficialResourceType } from "../types";

type ResourceViewerProps = {
  storagePath: string;
  type: OfficialResourceType;
  title: string;
};

export function ResourceViewer({ storagePath, type, title }: ResourceViewerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setUrl(null);
    setError(null);

    void getStorageDownloadUrl(storagePath)
      .then((nextUrl) => {
        if (isMounted) {
          setUrl(nextUrl);
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : "Could not load file.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [storagePath]);

  if (error) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border bg-secondary/50 p-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!url) {
    return <Skeleton className="h-80 w-full rounded-lg" />;
  }

  if (type === "image") {
    return (
      <div className="overflow-hidden rounded-lg border bg-secondary/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={title} className="max-h-[75dvh] w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-secondary/40">
      <iframe src={`${url}#toolbar=0`} title={title} className="h-[75dvh] min-h-[420px] w-full" />
      <div className="flex items-center gap-2 border-t bg-card px-3 py-3 text-xs text-muted-foreground sm:px-4">
        <FileText className="h-4 w-4" aria-hidden="true" />
        PDF is displayed inline.
      </div>
    </div>
  );
}
