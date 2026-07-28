import type { Metadata } from "next";
import { BookOpen, GraduationCap, Layers3, Target } from "lucide-react";

import { CourseCard, CtaBanner, FeatureCard, Section } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Courses",
  description: "Public Edexcel Mathematics course overview for IGCSE, O Level, and A Level.",
};

const courses = [
  {
    title: "IGCSE Mathematics",
    stage: "Years 10-11",
    description: "A complete support pathway for topic mastery, revision, and exam technique.",
    topics: ["Number", "Algebra", "Graphs", "Geometry"],
    icon: GraduationCap,
  },
  {
    title: "O Level Mathematics",
    stage: "Secondary",
    description: "Targeted lessons and practice for problem solving, accuracy, and presentation.",
    topics: ["Functions", "Vectors", "Trigonometry", "Statistics"],
    icon: BookOpen,
  },
  {
    title: "A Level Mathematics",
    stage: "Sixth form",
    description: "Advanced support across pure mathematics, mechanics, and statistics.",
    topics: ["Calculus", "Proof", "Mechanics", "Probability"],
    icon: Layers3,
  },
];

const support = [
  {
    title: "Topic sequencing",
    description: "Students move through a deliberate order that connects prior knowledge to new skills.",
    icon: Target,
  },
  {
    title: "Exam practice",
    description: "Practice is framed around question style, time pressure, and mark allocation.",
    icon: BookOpen,
  },
  {
    title: "Revision rhythm",
    description: "Regular review keeps methods fresh and supports long-term confidence.",
    icon: GraduationCap,
  },
];

export default function CoursesPage() {
  return (
    <>
      <Section
        className="pt-20 sm:pt-28"
        eyebrow="Courses"
        title="Premium Edexcel Mathematics courses for every stage."
        description="A static public overview of the main teaching pathways offered through the platform."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.title} {...course} />
          ))}
        </div>
      </Section>

      <Section className="bg-card" eyebrow="Support model" title="Built for steady progress.">
        <div className="grid gap-5 md:grid-cols-3">
          {support.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </Section>

      <Section>
        <CtaBanner
          title="Pair course lessons with model answers."
          description="Use the public model answer overview to understand how worked solutions support revision."
          primaryLabel="View model answers"
          primaryHref="/model-answers"
          secondaryLabel="Contact"
          secondaryHref="/contact"
        />
      </Section>
    </>
  );
}
