import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Courses", href: "/courses" },
  { label: "Model Answers", href: "/model-answers" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
      <Container className="flex min-h-16 items-center justify-between gap-4 py-3">
        <Link href="/" className="shrink-0 text-sm font-semibold tracking-normal text-foreground">
          Edexcel Mathematics
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navigation.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <nav className="flex items-center gap-2 md:hidden" aria-label="Primary">
          <Button asChild variant="ghost" size="sm">
            <Link href="/courses">Courses</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/contact">Contact</Link>
          </Button>
        </nav>
      </Container>
    </header>
  );
}
