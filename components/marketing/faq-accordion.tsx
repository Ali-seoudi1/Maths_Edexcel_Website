import { ChevronDown } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div className="mx-auto max-w-3xl divide-y rounded-lg border border-border/70 bg-card shadow-soft">
      {items.map((item) => (
        <details key={item.question} className="group p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-sm font-semibold text-foreground">
            <span>{item.question}</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
