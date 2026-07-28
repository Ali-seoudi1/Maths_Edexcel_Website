import { Container } from "@/components/shared/container";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <Container className="grid gap-8 py-10 text-sm text-muted-foreground md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-semibold text-foreground">Edexcel Mathematics</p>
          <p className="mt-2 max-w-xl leading-6">
            Premium IGCSE, O Level, and A Level mathematics teaching with a structured,
            exam-focused approach.
          </p>
        </div>
        <p>© 2026 Edexcel Mathematics Teacher. All rights reserved.</p>
      </Container>
    </footer>
  );
}
