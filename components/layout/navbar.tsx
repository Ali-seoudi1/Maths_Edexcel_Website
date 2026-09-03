import { Sigma } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Teaching", href: "/#teaching" },
  { label: "Contact", href: "/#contact" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dfe4ee] bg-white/95 backdrop-blur">
      <Container className="flex min-h-[86px] max-w-[1180px] items-center justify-between gap-4 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2f9a84] text-white shadow-soft">
            <Sigma className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold leading-5 tracking-normal text-[#07112f]">
              Omar El Adawy
            </span>
            <span className="mt-1 block text-xs font-medium text-[#59627d]">
              Edexcel IGCSE Mathematics
            </span>
          </span>
        </Link>
        <nav
          className="hidden items-center gap-9 text-[15px] font-medium text-[#39415d] md:flex"
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-[#07112f]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-12 rounded-xl border-[#dfe4ee] bg-white px-7 text-[15px] text-[#07112f] shadow-sm hover:bg-[#f6f8fb]"
          >
            <Link href="/sign-in">Login</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
