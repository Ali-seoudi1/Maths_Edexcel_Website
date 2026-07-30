import type { Metadata } from "next";
import { CheckCircle2, FileCheck2, ListChecks, PencilRuler } from "lucide-react";

import { CtaBanner, FeatureCard, Section } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Model Answers",
  description: "Static public overview of Edexcel Mathematics model answer resources.",
};

const modelAnswerFeatures = [
  {
    title: "Step-by-step solutions",
    description: "Worked examples show the reasoning behind each mathematical move.",
    icon: ListChecks,
  },
  {
    title: "Exam-style presentation",
    description: "Solutions model clear notation, method marks, and final answer structure.",
    icon: FileCheck2,
  },
  {
    title: "Common mistakes",
    description: "Guidance highlights where students often lose marks and how to avoid it.",
    icon: CheckCircle2,
  },
  {
    title: "Revision-ready layout",
    description:
      "Answers are organised so students can revisit methods quickly before assessments.",
    icon: PencilRuler,
  },
];

export default function ModelAnswersPage() {
  return (
    <>
      <Section
        className="pt-20 sm:pt-28"
        eyebrow="Model answers"
        title="Clear worked solutions that teach the method, not just the final result."
        description="A premium public overview of model answer resources for Edexcel Mathematics students."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {modelAnswerFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Section>

      <Section className="bg-card">
        <div className="mx-auto max-w-4xl rounded-lg border border-border/70 bg-background p-6 shadow-card sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Example structure
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["Read the demand", "Show the method", "Check the mark"].map((step, index) => (
              <div key={step} className="rounded-md border bg-card p-5">
                <p className="text-sm font-semibold text-primary">0{index + 1}</p>
                <p className="mt-3 text-sm font-semibold text-foreground">{step}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Static placeholder guidance for the public marketing page.
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <CtaBanner
          title="Use model answers alongside structured lessons."
          description="The course overview explains how lessons, assignments, and quizzes support the same exam-focused approach."
          primaryLabel="Explore courses"
          primaryHref="/courses"
          secondaryLabel="Contact"
          secondaryHref="/contact"
        />
      </Section>
    </>
  );
}
