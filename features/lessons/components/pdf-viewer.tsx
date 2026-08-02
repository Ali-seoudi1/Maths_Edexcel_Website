"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type PdfViewerProps = {
  src: string;
  title: string;
};

export function PdfViewer({ src, title }: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Zoom out"
            onClick={() => setZoom((value) => Math.max(75, value - 10))}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="w-14 text-center text-sm text-muted-foreground">{zoom}%</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Zoom in"
            onClick={() => setZoom((value) => Math.min(150, value + 10))}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="h-[75vh] overflow-auto bg-secondary p-3">
        <iframe
          src={`${src}#toolbar=0&navpanes=0&scrollbar=1`}
          title={title}
          className="mx-auto h-full min-h-[620px] w-full rounded-md bg-white"
          style={{ width: `${zoom}%` }}
        />
      </div>
    </div>
  );
}
