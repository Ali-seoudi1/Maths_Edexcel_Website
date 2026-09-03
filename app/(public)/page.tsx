import type { Metadata } from "next";
import Image from "next/image";
import {
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  Layers3,
  LogIn,
  Mail,
  PenLine,
  Presentation,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { AuthenticatedHomeRedirect } from "@/features/auth";

const siteUrl = "https://www.omareladawymathigcse.com";
const contactEmail = "omarahmedadawy@gmail.com";
const teacherPhotoSrc = "/images/omar-eladawy.jpeg";
const homepageTitle = "Omar El Adawy | Edexcel IGCSE Mathematics";
const homepageDescription =
  "Private Edexcel IGCSE Mathematics teaching with Omar El Adawy, combining structured lessons, exam-focused practice, assessments, feedback, and progress reports.";

export const metadata: Metadata = {
  title: homepageTitle,
  description: homepageDescription,
  keywords: [
    "Omar El Adawy",
    "Edexcel IGCSE Mathematics",
    "IGCSE Mathematics teacher",
    "Edexcel Mathematics",
    "Edexcel IGCSE Maths",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: homepageTitle,
    description: homepageDescription,
    url: siteUrl,
    siteName: "Omar El Adawy Edexcel IGCSE Mathematics",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary",
    title: homepageTitle,
    description: homepageDescription,
  },
};

const platformItems = [
  {
    title: "Lessons",
    description: "Structured teaching materials for Edexcel IGCSE Mathematics.",
    icon: BookOpenCheck,
  },
  {
    title: "Assignments",
    description: "Purposeful independent practice after lessons.",
    icon: PenLine,
  },
  {
    title: "Quizzes",
    description: "Short checks that reveal what needs more practice.",
    icon: ClipboardCheck,
  },
  {
    title: "Exams",
    description: "Timed assessment practice for exam readiness.",
    icon: Timer,
  },
  {
    title: "Past Papers & Model Answers",
    description: "Exam-style preparation using worked solutions.",
    icon: FileQuestion,
  },
  {
    title: "Live Meetings",
    description: "Teacher-led sessions for direct explanation and support.",
    icon: Presentation,
  },
  {
    title: "Reports",
    description: "Clear progress updates for students and parents.",
    icon: BarChart3,
  },
];

const approachItems = [
  {
    title: "Clear explanations",
    description: "Difficult ideas are broken into calm, understandable steps.",
    icon: Sparkles,
  },
  {
    title: "Structured practice",
    description: "Lessons move from foundations to exam-standard questions.",
    icon: Layers3,
  },
  {
    title: "Regular feedback",
    description: "Students receive guidance that helps them improve deliberately.",
    icon: CheckCircle2,
  },
  {
    title: "Tracked progress",
    description: "Performance is followed over time so next steps stay clear.",
    icon: Target,
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Omar El Adawy Edexcel IGCSE Mathematics",
      url: siteUrl,
      description: homepageDescription,
      inLanguage: "en-GB",
      publisher: {
        "@id": `${siteUrl}/#omar-el-adawy`,
      },
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#omar-el-adawy`,
      name: "Omar El Adawy",
      url: siteUrl,
      email: contactEmail,
      jobTitle: "Edexcel IGCSE Mathematics Teacher",
      description:
        "Omar El Adawy specializes in Edexcel IGCSE Mathematics teaching, structured practice, and exam-focused preparation.",
    },
  ],
};

export default function PublicHomePage() {
  return (
    <>
      <AuthenticatedHomeRedirect />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="bg-white text-[#07112f]">
        <section className="border-b border-[#dfe4ee] bg-[#f6f8fb]">
          <Container className="max-w-[1180px] px-6 py-14 sm:px-8 md:py-18 lg:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="max-w-[700px]">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#218a78]">
                  Omar El Adawy | Edexcel IGCSE Mathematics
                </p>
                <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-normal text-[#10162f] sm:text-5xl lg:text-[58px]">
                  Learn Edexcel IGCSE Mathematics with Omar El Adawy
                </h1>
                <p className="mt-6 max-w-[620px] text-lg leading-8 text-[#58617d]">
                  Students receive structured lessons, exam-focused preparation, clear
                  explanations, regular assessments, feedback, and progress reports through a
                  dedicated learning platform.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-13 rounded-xl bg-[#2f9a84] px-7 text-base text-white shadow-sm hover:bg-[#278672]"
                  >
                    <Link href="/sign-in">
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      Student Login
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-13 rounded-xl border-[#dfe4ee] bg-white px-7 text-base text-[#07112f] shadow-sm hover:bg-[#f9fafc]"
                  >
                    <Link href={`mailto:${contactEmail}`}>Contact Omar</Link>
                  </Button>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[460px] overflow-hidden rounded-[28px] border border-[#dfe4ee] bg-white p-3 shadow-[0_28px_70px_rgba(15,23,42,0.10)] lg:mx-0 lg:justify-self-end">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[#e9edf3]">
                  <Image
                    src={teacherPhotoSrc}
                    alt="Omar El Adawy, Edexcel IGCSE Mathematics teacher"
                    fill
                    priority
                    sizes="(min-width: 1024px) 460px, 100vw"
                    className="object-cover object-[center_34%]"
                  />
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-white py-20 md:py-24">
          <Container className="max-w-[1180px] px-6 sm:px-8">
            <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#218a78]">
                  Teaching platform
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-normal text-[#07112f] sm:text-4xl">
                  A focused space for Edexcel IGCSE Mathematics study
                </h2>
              </div>
              <p className="text-base leading-7 text-[#58617d] md:max-w-2xl">
                The platform supports Omar&apos;s teaching with organized lessons, practice,
                assessments, live meetings, and report visibility for a clear learning routine.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {platformItems.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-[#dfe4ee] bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.055)]"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e1f3ee] text-[#218a78]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold tracking-normal text-[#07112f]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#58617d]">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </Container>
        </section>

        <section id="about" className="border-y border-[#dfe4ee] bg-[#f6f8fb] py-20 md:py-24">
          <Container className="max-w-[1180px] px-6 sm:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
              <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#14243f_0%,#195352_58%,#2f9a84_100%)] p-5 shadow-[0_24px_65px_rgba(15,23,42,0.12)]">
                <div className="relative min-h-[440px] overflow-hidden rounded-[22px] border border-white/15 bg-white/5">
                  <Image
                    src={teacherPhotoSrc}
                    alt="Omar El Adawy"
                    fill
                    sizes="(min-width: 1024px) 470px, 100vw"
                    className="object-cover object-[center_34%]"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#218a78]">
                  About the teacher
                </p>
                <h2 className="mt-5 text-3xl font-bold leading-tight tracking-normal text-[#07112f] sm:text-4xl">
                  Omar El Adawy teaches Edexcel IGCSE Mathematics
                </h2>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-[#58617d]">
                  Omar El Adawy specializes exclusively in Edexcel IGCSE Mathematics and helps
                  students build confidence through clear explanations, structured lessons, and
                  extensive past paper practice.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  {["Edexcel IGCSE Mathematics", "Structured lessons", "Past paper practice"].map(
                    (item) => (
                      <span
                        key={item}
                        className="rounded-full bg-[#101a39] px-4 py-2 text-sm font-semibold text-white"
                      >
                        {item}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section id="teaching" className="bg-white py-20 md:py-24">
          <Container className="max-w-[1180px] px-6 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#218a78]">
                Teaching approach
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-normal text-[#07112f] sm:text-4xl">
                Why students learn with Omar El Adawy
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {approachItems.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[24px] border border-[#dfe4ee] bg-white p-7 shadow-[0_16px_45px_rgba(15,23,42,0.065)]"
                  >
                    <div className="flex items-start gap-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e1f3ee] text-[#218a78]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-xl font-bold tracking-normal text-[#07112f]">
                          {item.title}
                        </h3>
                        <p className="mt-3 text-base leading-7 text-[#58617d]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </Container>
        </section>

        <section className="bg-[#f6f8fb] py-20 md:py-24">
          <Container className="max-w-[1180px] px-6 sm:px-8">
            <div className="overflow-hidden rounded-[28px] bg-[#101a39] p-8 text-white shadow-[0_24px_65px_rgba(15,23,42,0.16)] md:p-12">
              <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#66d2bb]">
                    Student platform
                  </p>
                  <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
                    Existing students can access their learning space securely.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                    Lessons, assignments, quizzes, exams, resources, meetings, and reports are kept
                    together in one organized platform.
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="h-13 rounded-xl bg-[#2f9a84] px-7 text-base text-white hover:bg-[#278672]"
                >
                  <Link href="/sign-in">
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    Student Login
                  </Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        <section id="contact" className="bg-white py-20 md:py-24">
          <Container className="max-w-[1180px] px-6 sm:px-8">
            <div className="grid gap-10 rounded-[28px] border border-[#dfe4ee] bg-white p-8 shadow-[0_16px_45px_rgba(15,23,42,0.065)] md:grid-cols-[0.9fr_1.1fr] md:p-12">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#218a78]">
                  Contact
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-normal text-[#07112f] sm:text-4xl">
                  Speak with Omar about Edexcel IGCSE Mathematics
                </h2>
              </div>
              <div>
                <a
                  href={`mailto:${contactEmail}`}
                  className="block rounded-2xl border border-[#dfe4ee] bg-[#f8fafc] p-6 transition-colors hover:bg-white"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e1f3ee] text-[#218a78]">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-sm font-semibold text-[#58617d]">Email Address</p>
                  <p className="mt-2 break-words font-bold text-[#07112f]">{contactEmail}</p>
                </a>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
