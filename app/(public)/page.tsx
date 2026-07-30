import {
  BookOpen,
  Brain,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Layers3,
  MonitorPlay,
  Sparkles,
  Target,
  Video,
} from "lucide-react";

import {
  CourseCard,
  CtaBanner,
  FaqAccordion,
  FeatureCard,
  Hero,
  Section,
  StatisticCard,
  TestimonialCard,
} from "@/components/marketing";

const statistics = [
  { value: "420+", label: "Students", detail: "Supported across Edexcel pathways." },
  { value: "12+", label: "Years of Experience", detail: "Specialist mathematics teaching." },
  { value: "1,800+", label: "Lessons", detail: "Structured, exam-focused sessions." },
  { value: "96%", label: "Success Rate", detail: "Static placeholder outcome metric." },
];

const reasons = [
  {
    title: "Exam-led clarity",
    description:
      "Lessons are built around Edexcel assessment objectives, mark schemes, and common examiner expectations.",
    icon: Target,
  },
  {
    title: "Precise explanations",
    description:
      "Complex topics are broken into clean steps so students understand both the method and the reasoning.",
    icon: Brain,
  },
  {
    title: "Premium structure",
    description:
      "Each stage has a clear learning sequence, revision rhythm, and model answer support.",
    icon: Sparkles,
  },
];

const courses = [
  {
    title: "IGCSE Mathematics",
    stage: "Years 10-11",
    description:
      "A complete route through number, algebra, geometry, statistics, and exam technique.",
    topics: ["Algebra", "Graphs", "Geometry"],
    icon: GraduationCap,
  },
  {
    title: "O Level Mathematics",
    stage: "Secondary",
    description:
      "Focused preparation for core and extended problem solving with clear worked examples.",
    topics: ["Functions", "Trigonometry", "Mensuration"],
    icon: BookOpen,
  },
  {
    title: "A Level Mathematics",
    stage: "Sixth form",
    description:
      "Rigorous pure mathematics, mechanics, and statistics support for ambitious students.",
    topics: ["Calculus", "Mechanics", "Statistics"],
    icon: Layers3,
  },
];

const features = [
  {
    title: "Recorded Lessons",
    description: "Reviewable lesson libraries for paced revision.",
    icon: MonitorPlay,
  },
  {
    title: "Model Answers",
    description: "Clean, mark-aware solutions for exam-style questions.",
    icon: FileCheck2,
  },
  {
    title: "Assignments",
    description: "Structured practice tasks aligned to each unit.",
    icon: ClipboardCheck,
  },
  {
    title: "Quizzes",
    description: "Short checks to consolidate methods and confidence.",
    icon: CheckCircle2,
  },
  {
    title: "Reports",
    description: "Progress summaries designed for clear next steps.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Live Lessons",
    description: "Interactive sessions focused on active problem solving.",
    icon: Video,
  },
];

const testimonials = [
  {
    quote: "The lessons made difficult topics feel organised and manageable before the exam.",
    name: "Parent of Year 11 student",
    detail: "IGCSE Mathematics",
  },
  {
    quote: "Model answers helped me understand exactly how marks are awarded.",
    name: "A Level student",
    detail: "Pure Mathematics",
  },
  {
    quote: "The teaching style is calm, precise, and focused on real exam performance.",
    name: "Parent feedback",
    detail: "O Level Mathematics",
  },
];

const faqs = [
  {
    question: "Which Edexcel courses are covered?",
    answer: "The public programme highlights IGCSE, O Level, and A Level Mathematics support.",
  },
  {
    question: "Are model answers included?",
    answer: "Yes. The marketing site presents model answer support as a core learning resource.",
  },
  {
    question: "Is this page connected to a student account?",
    answer:
      "No. This is a static public marketing website with no authentication or backend logic.",
  },
  {
    question: "Can parents review progress?",
    answer:
      "The platform feature set includes reports as a static public-facing feature description.",
  },
];

export default function PublicHomePage() {
  return (
    <>
      <Hero />

      <Section className="border-y bg-card py-10 sm:py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statistics.map((statistic) => (
            <StatisticCard key={statistic.label} {...statistic} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Why choose us"
        title="A refined teaching experience for serious mathematics progress."
        description="Every resource is designed to reduce friction, strengthen technique, and make revision feel calm and purposeful."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {reasons.map((reason) => (
            <FeatureCard key={reason.title} {...reason} />
          ))}
        </div>
      </Section>

      <Section
        id="subjects"
        className="bg-card"
        eyebrow="Subjects"
        title="Edexcel pathways from IGCSE to A Level."
        description="Static course cards for the public website, ready to connect to deeper content later."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.title} {...course} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Platform features"
        title="The learning tools students expect from a modern course."
        description="A polished public overview of the platform experience without implementing business logic."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Section>

      <Section
        className="bg-card"
        eyebrow="Testimonials"
        title="Placeholder feedback from students and parents."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Common questions, answered simply.">
        <FaqAccordion items={faqs} />
      </Section>

      <Section className="pt-0">
        <CtaBanner
          title="Build confidence with a focused Edexcel Mathematics pathway."
          description="Explore the public course overview and model answer resources prepared for the marketing website."
        />
      </Section>
    </>
  );
}
