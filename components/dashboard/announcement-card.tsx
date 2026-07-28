type AnnouncementCardProps = {
  title: string;
  timestamp: string;
};

export function AnnouncementCard({ title, timestamp }: AnnouncementCardProps) {
  return (
    <article className="flex gap-4 border-b border-border/70 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-warning" />
      <div className="min-w-0">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{timestamp}</p>
      </div>
    </article>
  );
}
