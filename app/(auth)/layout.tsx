import type { ReactNode } from "react";

type AuthenticationLayoutProps = {
  children: ReactNode;
};

export default function AuthenticationLayout({ children }: AuthenticationLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/60 px-6 py-12">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
