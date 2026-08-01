import { Play } from "lucide-react";
import Link from "next/link";

import {
  AnnouncementCard,
  CountdownCard,
  DashboardCard,
  LessonCard,
  PageTitle,
  QuestionCard,
  QuizResultCard,
  SectionCard,
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";

const lessons = [
  {
    topic: "Factorization",
    title: "Difference of Two Squares",
    progress: 68,
  },
  {
    topic: "Functions",
    title: "Composite Functions",
    progress: 35,
  },
  {
    topic: "Algebra",
    title: "Simultaneous Equations",
    progress: 90,
  },
  {
    topic: "Trigonometry",
    title: "Sine & Cosine Rule",
    progress: 12,
  },
];

const bookmarkedQuestions = [
  {
    title: "Circle Theorems - Q9",
    meta: "Jun 2022 · Paper 1H",
  },
  {
    title: "Vectors - Q14",
    meta: "Nov 2021 · Paper 2H",
  },
  {
    title: "Probability Trees - Q6",
    meta: "Jun 2023 · Paper 1H",
  },
];

const recentlyViewed = [
  {
    title: "Surds - Q3",
    meta: "May 2023 · Paper 1H",
  },
  {
    title: "Algebraic Fractions - Q11",
    meta: "Jun 2022 · Paper 2H",
  },
  {
    title: "Straight Line Graphs - Q8",
    meta: "Nov 2022 · Paper 1H",
  },
];

const announcements = [
  {
    title: "Paper 2H mock exam moved to Sunday",
    timestamp: "Posted 2 hours ago",
  },
  {
    title: "New model answers added for June 2024",
    timestamp: "Posted yesterday",
  },
  {
    title: "Half-term revision schedule is up",
    timestamp: "Posted 3 days ago",
  },
];

const quizResults = [
  {
    title: "Algebra Basics Quiz",
    score: "17/20",
    tone: "success" as const,
  },
  {
    title: "Trigonometry Check",
    score: "12/20",
    tone: "warning" as const,
  },
  {
    title: "Number Skills",
    score: "19/20",
    tone: "success" as const,
  },
];

function ViewAllLink({ href = "#" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-bold text-success transition-colors hover:text-primary"
    >
      View all
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-9">
      <PageTitle eyebrow="Wednesday, 27 June" title="Welcome back" />

      <section className="space-y-5" aria-labelledby="continue-watching-title">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="continue-watching-title"
            className="text-xl font-bold tracking-normal text-slate-950"
          >
            Continue Watching
          </h2>
          <Link
            href="#"
            className="text-sm font-bold text-success transition-colors hover:text-primary"
          >
            View all lessons
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.title} {...lesson} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DashboardCard className="min-h-52">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Upcoming Live Lesson
          </p>
          <h2 className="mt-3 text-xl font-bold text-slate-950">Quadratic Graphs - Live Review</h2>
          <p className="mt-2 text-base font-medium text-muted-foreground">
            Today · 6:00 PM - 7:00 PM · via Zoom
          </p>
          <Button type="button" className="mt-6 rounded-xl bg-success hover:bg-success/90">
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            Join Zoom Link
          </Button>
        </DashboardCard>

        <CountdownCard
          eyebrow="Upcoming Homework"
          title="Paper 2H Mixed Revision Set"
          actionLabel="Submit Homework"
          units={[
            { value: "1", label: "Day" },
            { value: "14", label: "Hrs" },
            { value: "05", label: "Min" },
          ]}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Bookmarked Questions" action={<ViewAllLink />}>
          {bookmarkedQuestions.map((question) => (
            <QuestionCard key={question.title} {...question} />
          ))}
        </SectionCard>

        <SectionCard title="Recently Viewed" action={<ViewAllLink />}>
          {recentlyViewed.map((question) => (
            <QuestionCard key={question.title} {...question} variant="recent" />
          ))}
        </SectionCard>

        <SectionCard title="Latest Announcements" action={<ViewAllLink />}>
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement.title} {...announcement} />
          ))}
        </SectionCard>

        <SectionCard title="Latest Quiz Results" action={<ViewAllLink />}>
          {quizResults.map((quizResult) => (
            <QuizResultCard key={quizResult.title} {...quizResult} />
          ))}
        </SectionCard>
      </section>
    </div>
  );
}
