import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CtaBannerProps = {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
};

export function CtaBanner({
  title,
  description,
  primaryLabel = "Explore courses",
  primaryHref = "/courses",
  secondaryLabel = "View model answers",
  secondaryHref = "/model-answers",
  className,
}: CtaBannerProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-primary/20 bg-primary px-6 py-8 text-primary-foreground shadow-card sm:px-10 sm:py-10",
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-primary-foreground/80 sm:text-base">
            {description}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
