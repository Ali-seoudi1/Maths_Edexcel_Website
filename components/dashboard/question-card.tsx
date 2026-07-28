import { ArrowRight, Bookmark, Clock3 } from "lucide-react";

type QuestionCardProps = {
  title: string;
  meta: string;
  variant?: "bookmark" | "recent";
};

export function QuestionCard({ title, meta, variant = "bookmark" }: QuestionCardProps) {
  const Icon = variant === "bookmark" ? Bookmark : Clock3;

  return (
    <div className="flex items-center gap-4 border-b border-border/70 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-bold text-slate-950">{title}</h3>
        <p className="mt-1 inline-flex max-w-full items-center gap-2 truncate rounded-lg bg-sidebar px-3 py-1 text-xs font-bold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {meta}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}
