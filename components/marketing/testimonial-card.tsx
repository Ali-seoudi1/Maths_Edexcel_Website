import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TestimonialCardProps = {
  quote: string;
  name: string;
  detail: string;
  className?: string;
};

export function TestimonialCard({ quote, name, detail, className }: TestimonialCardProps) {
  return (
    <Card className={cn("h-full border-border/70 bg-card shadow-soft", className)}>
      <CardContent className="p-6">
        <p className="text-sm leading-7 text-foreground">&ldquo;{quote}&rdquo;</p>
        <div className="mt-6 border-t pt-4">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
