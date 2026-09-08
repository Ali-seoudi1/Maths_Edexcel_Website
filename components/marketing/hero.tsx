import { ArrowRight, BookOpenCheck, PlayCircle } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-28 lg:py-32">
      <Container className="grid items-center gap-14 lg:grid-cols-[1.03fr_0.97fr]">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
            Edexcel Mathematics tutoring for ambitious students
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl lg:text-6xl">
            Clear, exam-focused mathematics teaching for Edexcel success.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            Premium IGCSE, O Level and A Level support with structured lessons, precise model
            answers and calm guidance from a professional mathematics teacher.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/courses">
                Explore courses
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/model-answers">
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                View model answers
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-lg border border-border/70 bg-card p-4 shadow-card">
            <div className="rounded-md border bg-background p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Lesson workspace</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Professional illustration placeholder
                  </p>
                </div>
                <div className="rounded-md bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  Live
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4 rounded-md border bg-card p-4">
                  <div className="h-3 w-28 rounded bg-primary/20" />
                  <div className="space-y-2">
                    <div className="h-3 rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                  </div>
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm font-semibold text-foreground">dy/dx = 3x² - 4x + 1</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Step-by-step reasoning, notation and exam technique in one focused view.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-md border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground">Progress</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">92%</p>
                    <div className="mt-3 h-2 rounded bg-muted">
                      <div className="h-2 w-11/12 rounded bg-primary" />
                    </div>
                  </div>
                  <div className="rounded-md border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground">Next lesson</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Integration methods
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">A Level Pure Mathematics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
