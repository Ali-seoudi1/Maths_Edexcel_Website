import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CourseCardProps = {
  title: string;
  stage: string;
  description: string;
  topics: string[];
  icon: LucideIcon;
  className?: string;
};

export function CourseCard({
  title,
  stage,
  description,
  topics,
  icon: Icon,
  className,
}: CourseCardProps) {
  return (
    <Card className={cn("h-full overflow-hidden border-border/70 bg-card shadow-soft", className)}>
      <CardHeader className="border-b border-border/70 bg-secondary/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <Badge variant="secondary">{stage}</Badge>
        </div>
        <CardTitle className="pt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <span
              key={topic}
              className="rounded-md border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              {topic}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
