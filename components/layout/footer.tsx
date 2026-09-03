import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/shared/container";

const contactEmail = "omarahmedadawy@gmail.com";
const logoSrc = "/images/logo.jpeg";

export function Footer() {
  return (
    <footer className="border-t border-[#dfe4ee] bg-white">
      <Container className="flex max-w-[1180px] flex-col gap-6 py-10 text-sm text-[#5b627c] md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#dfe4ee] bg-white shadow-soft">
            <Image
              src={logoSrc}
              alt="Omar El Adawy logo"
              fill
              sizes="40px"
              className="object-contain p-1.5"
            />
          </span>
          <div>
            <p className="text-base font-bold text-[#07112f]">Omar El Adawy</p>
            <p className="mt-1 text-xs font-medium text-[#59627d]">Edexcel IGCSE Mathematics</p>
            <a href={`mailto:${contactEmail}`} className="mt-2 block hover:text-[#07112f]">
              {contactEmail}
            </a>
          </div>
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
