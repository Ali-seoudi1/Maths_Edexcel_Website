import { Sigma } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <Container className="flex min-h-16 max-w-[1180px] items-center justify-between gap-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Sigma className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold leading-5 tracking-normal text-foreground">
              Omar El Adawy
            </span>
            <span className="mt-1 block text-xs font-medium text-muted-foreground">
              Edexcel IGCSE Mathematics
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-10 rounded-xl px-5">
            <Link href="/sign-in">Login</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
