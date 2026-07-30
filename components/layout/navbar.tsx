import { Sigma } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dfe4ee] bg-white/95 backdrop-blur">
      <Container className="flex min-h-[86px] max-w-[1400px] items-center justify-between gap-4 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2f9b87] text-white shadow-sm">
            <Sigma className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-bold leading-5 tracking-normal text-[#07112f]">
              Omar El Adawy
            </span>
            <span className="mt-1 block text-xs font-medium text-[#5b627c]">
              Edexcel IGCSE Mathematics
            </span>
          </span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary">
          {navigation.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="sm"
              className="h-10 px-4 text-base font-medium text-[#3f4564] hover:bg-[#eef5f4] hover:text-[#07112f]"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 sm:flex md:hidden" aria-label="Primary">
            {navigation.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                size="sm"
                className="text-[#3f4564] hover:bg-[#eef5f4] hover:text-[#07112f]"
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-12 rounded-xl border-[#dfe4ee] bg-white px-6 text-base font-semibold text-[#07112f] shadow-sm hover:bg-[#f5f7fb]"
          >
            <Link href="/sign-in">Login</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
