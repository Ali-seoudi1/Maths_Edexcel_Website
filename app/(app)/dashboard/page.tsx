import { ArrowRight, BookOpen, ClipboardList, FileQuestion, Library, Lock, Search, Video } from "lucide-react";
import Link from "next/link";

import { PageHeader, SectionHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

const studyAreas = [
  {
    title: "Lessons",
    description: "Open lesson PDFs and solved examples organized by topic.",
    href: "/lessons",
    icon: BookOpen,
  },
  {
    title: "Model Answers",
    description: "Search exam questions by year, session, paper, and question number.",
    href: "/model-answers",
    icon: Search,
    locked: true,
  },
  {
    title: "Assignments",
    description: "View coursework, upload PDF solutions, and check grades.",
    href: "/assignments",
    icon: ClipboardList,
  },
  {
    title: "Quizzes",
    description: "Open active timed quizzes and review graded scores.",
    href: "/quizzes",
    icon: FileQuestion,
  },
  {
    title: "Exams",
    description: "Open active timed exams and review graded scores.",
    href: "/exams",
    icon: FileQuestion,
  },
  {
    title: "Live Meeting",
    description: "Join the current live class link when your teacher posts one.",
    href: "/live-meeting",
    icon: Video,
  },
  {
    title: "Past Papers",
    description: "Use past paper resources for revision practice.",
    href: "/past-papers",
    icon: Library,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Student Dashboard"
        title="Welcome back"
        description="Choose what you want to study next. Your lessons, model answers, assignments, and quizzes are grouped into focused areas."
      />

      <section className="space-y-4">
        <SectionHeader
          title="Study areas"
          description="Start with the section that matches what you need to do today."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {studyAreas.map((area) => {
            const Icon = area.icon;

            if (area.locked) {
              return (
                <Card key={area.href} className="h-full opacity-80">
                  <CardContent className="flex h-full flex-col gap-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        Locked
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{area.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{area.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Link key={area.href} href={area.href} className="group focus-visible:outline-none">
                <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-card group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <CardContent className="flex h-full flex-col gap-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <ArrowRight className="mt-3 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{area.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{area.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
