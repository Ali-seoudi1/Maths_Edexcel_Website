"use client";

import { Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExamPdfViewerProps = {
  src: string;
  title: string;
};

export function ExamPdfViewer({ src, title }: ExamPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreen(document.fullscreenElement === containerRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  async function toggleFullscreen() {
    const element = containerRef.current;

    if (!element || !document.fullscreenEnabled) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await element.requestFullscreen();
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-hidden rounded-lg border bg-card shadow-soft",
        fullscreen && "flex h-dvh w-full flex-col rounded-none",
      )}
    >
      <div className="flex shrink-0 flex-col gap-3 border-b bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">Protected PDF preview</p>
        </div>
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
            onClick={() => setZoom((value) => Math.min(160, value + 10))}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" onClick={() => setZoom(100)}>
            Fit
          </Button>
          <Button type="button" variant="outline" onClick={() => void toggleFullscreen()}>
            {fullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" aria-hidden="true" />
                Exit fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>
      <div className={cn("h-[72dvh] overflow-auto bg-secondary p-3", fullscreen && "min-h-0 flex-1")}>
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
