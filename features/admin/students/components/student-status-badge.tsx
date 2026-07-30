import { Badge } from "@/components/ui/badge";

export function StudentStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant={active ? "secondary" : "outline"}
      className={active ? "bg-success/10 text-success" : "text-muted-foreground"}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
