import type { ReactNode } from "react";

import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  headerClassName,
}: SectionProps) {
  return (
    <section id={id} className={cn("py-20 sm:py-24", className)}>
      <Container>
        {title ? (
          <div className={cn("mx-auto mb-12 max-w-3xl text-center", headerClassName)}>
            {eyebrow ? (
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </Container>
    </section>
  );
}
