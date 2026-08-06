import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Mail,
  Phone,
  Pi,
  Target,
} from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthenticatedHomeRedirect } from "@/features/auth";

const features = [
  {
    title: "Edexcel Specialist",
    description: "Focused exclusively on Edexcel IGCSE Mathematics.",
    icon: BookOpenCheck,
  },
  {
    title: "Exam-Focused Learning",
    description: "Lessons designed around the official Edexcel syllabus.",
    icon: Target,
  },
  {
    title: "Past Paper Practice",
    description: "Students gain confidence by solving real examination questions.",
    icon: ClipboardCheck,
  },
  {
    title: "Clear Explanations",
    description:
      "Every lesson simplifies difficult mathematical concepts into easy-to-understand steps.",
    icon: CheckCircle2,
  },
];

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-14 max-w-3xl text-center">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2f9b87]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-bold tracking-normal text-[#07112f] sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-[#5b627c]">{description}</p>
      ) : null}
    </div>
  );
}

export default function PublicHomePage() {
  return (
    <>
      <AuthenticatedHomeRedirect />
      <section className="overflow-hidden border-b border-[#dfe4ee] bg-[#f5f7fb] py-24 sm:py-32 lg:py-36">
        <Container className="grid max-w-[1400px] items-center gap-16 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2f9b87]">
              Edexcel IGCSE Mathematics Teacher
            </p>
            <h1 className="mt-6 text-5xl font-bold leading-[1.04] tracking-normal text-[#07112f] sm:text-6xl lg:text-7xl">
              Master Edexcel IGCSE Mathematics with Confidence
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5b627c]">
              Students receive structured lessons, exam-focused preparation, and clear
              explanations that help them build confidence and succeed in Edexcel IGCSE
              Mathematics.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 rounded-xl bg-[#2f9b87] px-8 text-base font-bold text-white shadow-sm hover:bg-[#278773]"
              >
                <Link href="/sign-in">Login</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 rounded-xl border-[#dfe4ee] bg-white px-8 text-base font-bold text-[#07112f] shadow-sm hover:bg-[#f8fafc]"
              >
                <Link href="#contact">Contact</Link>
              </Button>
            </div>
          </div>

          <Card className="rounded-[1.55rem] border border-[#dfe4ee] bg-white shadow-[0_28px_70px_rgba(8,17,47,0.10)]">
            <CardContent className="p-6 sm:p-8">
              <div className="rounded-[1.25rem] bg-white p-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-[#07112f]">Learning focus</p>
                    <p className="mt-2 text-sm text-[#5b627c]">
                      Clear preparation for Edexcel IGCSE Mathematics
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#dff1ed] text-[#2f9b87]">
                    <Pi className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-8 divide-y divide-[#e4e8f1]">
                  {[
                    "Official syllabus guidance",
                    "Past paper practice",
                    "Step-by-step explanations",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-6 py-5"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dff1ed] text-[#2f9b87]">
                          <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="text-base font-bold text-[#07112f]">{item}</span>
                      </div>
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2f9b87]" aria-hidden="true" />
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-[#f5f7fb] p-5">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xl font-bold text-[#07112f]">01</p>
                      <p className="mt-1 text-xs font-medium text-[#5b627c]">Learn</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#07112f]">02</p>
                      <p className="mt-1 text-xs font-medium text-[#5b627c]">Practise</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#07112f]">03</p>
                      <p className="mt-1 text-xs font-medium text-[#5b627c]">Improve</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      <section id="about" className="border-y border-[#dfe4ee] bg-white py-20 sm:py-24">
        <Container className="grid max-w-[1400px] items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[1.55rem] bg-gradient-to-br from-[#14213d] via-[#1f5d61] to-[#2f9b87] shadow-[0_28px_70px_rgba(8,17,47,0.12)]">
            <div className="flex aspect-[4/5] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
                  <span className="text-4xl font-bold">OE</span>
                </div>
                <p className="mt-5 text-sm font-semibold text-white/75">
                  Professional teacher photo
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2f9b87]">
              About the teacher
            </p>
            <h2 className="mt-5 text-4xl font-bold leading-tight tracking-normal text-[#07112f] sm:text-5xl">
              Omar El Adawy
            </h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5b627c]">
              Omar El Adawy specializes exclusively in Edexcel IGCSE Mathematics (O Level),
              helping students build confidence through clear explanations, structured lessons,
              and extensive past paper practice. His teaching approach is focused, calm, and
              designed to help students understand each concept before applying it in examination
              questions.
            </p>
            <div className="mt-7 inline-flex rounded-lg bg-[#101a3d] px-4 py-2 text-sm font-bold text-white shadow-sm">
              <span className="mr-2 text-[#2f9b87]">•</span>
              Edexcel IGCSE Mathematics (O Level)
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[#f5f7fb] py-20 sm:py-24">
        <Container className="max-w-[1400px]">
          <SectionHeader
            eyebrow="Why choose Omar El Adawy"
            title="Focused support for Edexcel IGCSE Mathematics students."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={feature.title}
                  className="h-full rounded-[1.35rem] border border-[#e2e7ef] bg-white shadow-[0_18px_48px_rgba(8,17,47,0.06)]"
                >
                  <CardContent className="p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#dff1ed] text-[#2f9b87]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-lg font-bold tracking-normal text-[#07112f]">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#5b627c]">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      <section id="contact" className="bg-white py-20 sm:py-24">
        <Container className="max-w-[1400px]">
          <SectionHeader
            eyebrow="Contact"
            title="Speak with Omar El Adawy"
            description="For enquiries about Edexcel IGCSE Mathematics lessons, use the contact details below."
          />
          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
            <Card className="rounded-[1.35rem] border border-[#e2e7ef] bg-white shadow-[0_18px_48px_rgba(8,17,47,0.06)]">
              <CardContent className="flex items-start gap-5 p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#dff1ed] text-[#2f9b87]">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#07112f]">Phone Number</p>
                  <p className="mt-2 text-sm font-medium text-[#5b627c]">+20 000 000 0000</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[1.35rem] border border-[#e2e7ef] bg-white shadow-[0_18px_48px_rgba(8,17,47,0.06)]">
              <CardContent className="flex items-start gap-5 p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#dff1ed] text-[#2f9b87]">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#07112f]">Email Address</p>
                  <p className="mt-2 text-sm font-medium text-[#5b627c]">hello@example.com</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
