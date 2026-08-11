"use client";

import { Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type QuizPdfViewerProps = {
  src: string;
  title: string;
};

export function QuizPdfViewer({ src, title }: QuizPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);

  async function toggleFullscreen() {
    const element = containerRef.current;

    if (!element || !document.fullscreenEnabled) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setFullscreen(false);
      return;
    }

    await element.requestFullscreen();
    setFullscreen(true);
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg border bg-card shadow-soft fullscreen:h-screen fullscreen:w-screen fullscreen:rounded-none"
    >
      <div className="flex flex-col gap-3 border-b bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
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
      <div className="h-[72vh] overflow-auto bg-secondary p-3 fullscreen:h-[calc(100vh-73px)]">
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
