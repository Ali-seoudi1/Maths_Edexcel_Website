import Link from "next/link";

import { Container } from "@/components/shared/container";

export function Footer() {
  return (
    <footer className="border-t border-[#dfe4ee] bg-white">
      <Container className="flex flex-col gap-5 py-9 text-sm text-[#5b627c] md:flex-row md:items-center md:justify-between">
        <p className="text-base font-bold text-[#07112f]">Omar El Adawy</p>
        <nav className="flex flex-wrap items-center gap-5" aria-label="Footer">
          <Link href="/" className="font-medium hover:text-[#07112f]">
            Home
          </Link>
          <Link href="/#about" className="font-medium hover:text-[#07112f]">
            About
          </Link>
          <Link href="/#contact" className="font-medium hover:text-[#07112f]">
            Contact
          </Link>
        </nav>
        <p>Copyright 2026 Omar El Adawy. All rights reserved.</p>
      </Container>
    </footer>
  );
}
