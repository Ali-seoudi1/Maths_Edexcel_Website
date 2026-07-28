import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

type LessonCardProps = {
  topic: string;
  title: string;
  progress: number;
  className?: string;
};

export function LessonCard({ topic, title, progress, className }: LessonCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="relative h-28 bg-[linear-gradient(135deg,#17213d_0%,#1d6967_58%,#2d9a80_100%)] p-4">
        <span className="inline-flex items-center gap-2 rounded-lg bg-slate-950/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {topic}
        </span>
        <div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur">
          <Play className="h-4 w-4 fill-current" aria-hidden="true" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-bold text-slate-950">{title}</h3>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-success" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm font-medium text-muted-foreground">{progress}% watched</p>
      </div>
    </article>
  );
}

export { LessonCard as ContinueWatchingCard };
