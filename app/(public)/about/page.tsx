import type { Metadata } from "next";
import { Award, BookMarked, Compass, GraduationCap } from "lucide-react";

import { CtaBanner, FeatureCard, Section, StatisticCard } from "@/components/marketing";

export const metadata: Metadata = {
  title: "About",
  description: "About the professional Edexcel Mathematics teacher and teaching approach.",
};

const values = [
  {
    title: "Structured mastery",
    description: "Each topic is sequenced from core fluency to exam-style application.",
    icon: Compass,
  },
  {
    title: "Mark scheme awareness",
    description: "Students learn how to present solutions with the detail examiners expect.",
    icon: BookMarked,
  },
  {
    title: "Calm confidence",
    description: "Lessons are paced to make difficult ideas feel clear, repeatable, and achievable.",
    icon: Award,
  },
];

export default function AboutPage() {
  return (
    <>
      <Section className="pb-12 pt-20 sm:pt-28" headerClassName="text-left mx-0">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">About</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              Professional Edexcel Mathematics teaching with a precise, student-first method.
            </h1>
            <p className="mt-6 text-base leading-8 text-muted-foreground sm:text-lg">
              This public website introduces a premium learning experience for IGCSE, O Level, and
              A Level Mathematics students. The teaching approach is built around clarity,
              consistency, and strong exam habits.
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card p-6 shadow-card">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary/10 text-primary">
              <GraduationCap className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="mt-6 text-sm font-semibold text-foreground">Teaching focus</p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Edexcel specification alignment, worked examples, targeted practice, and concise
              model answers that help students understand how to earn marks.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatisticCard value="IGCSE" label="Foundation" detail="Core fluency." />
              <StatisticCard value="O Level" label="Precision" detail="Exam method." />
              <StatisticCard value="A Level" label="Depth" detail="Advanced reasoning." />
            </div>
          </div>
        </div>
      </Section>

      <Section
        className="bg-card"
        eyebrow="Approach"
        title="A clear path from understanding to exam performance."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {values.map((value) => (
            <FeatureCard key={value.title} {...value} />
          ))}
        </div>
      </Section>

      <Section>
        <CtaBanner
          title="Explore the course pathways."
          description="Review the public course pages for IGCSE, O Level, and A Level Mathematics."
          primaryLabel="View courses"
          primaryHref="/courses"
          secondaryLabel="See model answers"
          secondaryHref="/model-answers"
        />
      </Section>
    </>
  );
}
