import Link from "next/link";

import { Container } from "@/components/shared/container";

const contactEmail = "omarahmedadawy@gmail.com";

export function Footer() {
  return (
    <footer className="border-t border-[#dfe4ee] bg-white">
      <Container className="flex max-w-[1180px] flex-col gap-6 py-10 text-sm text-[#5b627c] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-bold text-[#07112f]">Omar El Adawy</p>
          <a href={`mailto:${contactEmail}`} className="mt-2 block hover:text-[#07112f]">
            {contactEmail}
          </a>
        </div>
        <nav className="flex flex-wrap items-center gap-6" aria-label="Footer">
          <Link href="/" className="font-medium hover:text-[#07112f]">
            Home
          </Link>
          <Link href="/#about" className="font-medium hover:text-[#07112f]">
            About
          </Link>
          <Link href="/#teaching" className="font-medium hover:text-[#07112f]">
            Teaching
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
