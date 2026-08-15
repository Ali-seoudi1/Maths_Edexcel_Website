"use client";

import { Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PdfViewerProps = {
  src: string;
  title: string;
};

export function PdfViewer({ src, title }: PdfViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
      return;
    }

    await document.exitFullscreen();
    setIsFullscreen(false);
  }

  return (
    <div ref={viewerRef} className="overflow-hidden rounded-lg border bg-card shadow-soft">
      <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <p className="min-w-0 break-words text-sm font-semibold text-foreground">{title}</p>
        <div className="flex flex-wrap items-center gap-2">
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={isFullscreen ? "Exit full screen" : "Open full screen"}
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "h-[75vh] overflow-auto bg-secondary p-3",
          isFullscreen && "h-[calc(100dvh-73px)]",
        )}
      >
        <iframe
          src={`${src}#toolbar=0&navpanes=0&scrollbar=1`}
          title={title}
          className="mx-auto h-full min-h-[70dvh] w-full rounded-md bg-white"
          style={{ width: `${zoom}%` }}
        />
      </div>
    </div>
  );
}
