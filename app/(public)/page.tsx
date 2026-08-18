import type { Metadata } from "next";
import { BookOpenCheck, FileQuestion, GraduationCap, LogIn } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthenticatedHomeRedirect } from "@/features/auth";

const siteUrl = "https://www.omareladawymathigcse.com";
const homepageTitle = "Omar El Adawy | Maths IGCSE";
const homepageDescription =
  "Omar El Adawy Maths IGCSE is a focused mathematics learning and revision platform with lessons, resources, practice tasks, quizzes, and model answers for students.";

export const metadata: Metadata = {
  title: homepageTitle,
  description: homepageDescription,
  keywords: [
    "Omar El Adawy",
    "Omar El Adawy Maths IGCSE",
    "Maths IGCSE",
    "IGCSE Mathematics",
    "Edexcel Mathematics",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: homepageTitle,
    description: homepageDescription,
    url: siteUrl,
    siteName: "Omar El Adawy Maths IGCSE",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary",
    title: homepageTitle,
    description: homepageDescription,
  },
};

const highlights = [
  {
    title: "Lessons",
    description: "Structured Edexcel Mathematics materials.",
    icon: BookOpenCheck,
  },
  {
    title: "Model Answers",
    description: "Exam question solutions and mark schemes.",
    icon: FileQuestion,
  },
];

export default function PublicHomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Omar El Adawy Maths IGCSE",
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
        description: "Mathematics teacher associated with Omar El Adawy Maths IGCSE.",
      },
    ],
  };

  return (
    <>
      <AuthenticatedHomeRedirect />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="bg-background">
        <Container className="max-w-[1180px] px-5 py-12 sm:px-8 lg:py-16">
          <section className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                Omar El Adawy Maths IGCSE
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-normal text-foreground sm:text-5xl">
                A focused learning and revision platform for students.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Omar El Adawy provides IGCSE Mathematics lessons, revision resources, practice
                tasks, quizzes, and model answers through this private student platform.
              </p>
              <div className="mt-6">
                <Button asChild size="lg" className="h-12 rounded-xl px-6">
                  <Link href="/sign-in">
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    Login
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden rounded-xl border bg-card shadow-card">
              <CardContent className="p-0">
                <div className="bg-sidebar px-6 py-7 text-sidebar-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <GraduationCap className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Student Dashboard</p>
                      <p className="mt-1 text-xs text-sidebar-muted">Secure access required</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-6">
                  {highlights.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.title} className="rounded-xl border bg-background p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-foreground">{item.title}</h2>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        </Container>
      </main>
    </>
  );
}
