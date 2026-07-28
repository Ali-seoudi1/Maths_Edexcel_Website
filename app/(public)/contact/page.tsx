import type { Metadata } from "next";
import { CalendarDays, Mail, MessageCircle, Navigation } from "lucide-react";

import { CtaBanner, FeatureCard, Section } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Contact",
  description: "Static contact information page for the Edexcel Mathematics teacher.",
};

const contactOptions = [
  {
    title: "Email enquiries",
    description: "Use your preferred email client to ask about availability, course stage, and goals.",
    icon: Mail,
  },
  {
    title: "Parent consultation",
    description: "A short discussion can clarify the student's current level and support needs.",
    icon: MessageCircle,
  },
  {
    title: "Lesson planning",
    description: "Course recommendations are shaped around exam board, timeline, and confidence gaps.",
    icon: CalendarDays,
  },
];

export default function ContactPage() {
  return (
    <>
      <Section
        className="pt-20 sm:pt-28"
        eyebrow="Contact"
        title="Start a focused conversation about Edexcel Mathematics support."
        description="This page is intentionally static for the public marketing website. No forms, accounts, or backend logic are implemented."
      >
        <div className="mx-auto max-w-4xl rounded-lg border border-border/70 bg-card p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Navigation className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-foreground">
                Public contact placeholder
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Add preferred contact details here when the final business information is ready.
                The marketing site keeps this section presentational only.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-card" title="Contact paths for students and parents.">
        <div className="grid gap-5 md:grid-cols-3">
          {contactOptions.map((option) => (
            <FeatureCard key={option.title} {...option} />
          ))}
        </div>
      </Section>

      <Section>
        <CtaBanner
          title="Review the public course offer before getting in touch."
          description="The course and model answer pages outline the teaching experience available to students."
          primaryLabel="View courses"
          primaryHref="/courses"
          secondaryLabel="Model answers"
          secondaryHref="/model-answers"
        />
      </Section>
    </>
  );
}
