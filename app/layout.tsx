import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Edexcel Mathematics Platform",
    template: "%s | Edexcel Mathematics Platform",
  },
  description: "Foundation for a private Edexcel O Level Mathematics teaching platform.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
