"use client";

import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

type NavigationLoadingProviderProps = {
  children: ReactNode;
};

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function isNavigableAnchor(element: HTMLAnchorElement) {
  const target = element.getAttribute("target");
  const href = element.getAttribute("href");

  if (!href || href.startsWith("#") || target === "_blank" || element.hasAttribute("download")) {
    return false;
  }

  const nextUrl = new URL(element.href);
  const currentUrl = new URL(window.location.href);

  if (nextUrl.origin !== currentUrl.origin) {
    return false;
  }

  return nextUrl.pathname !== currentUrl.pathname || nextUrl.search !== currentUrl.search;
}

export function NavigationLoadingProvider({ children }: NavigationLoadingProviderProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement) || !isNavigableAnchor(anchor)) {
        return;
      }

      setIsLoading(true);
    }

    document.addEventListener("click", handleDocumentClick, true);

    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      document.documentElement.removeAttribute("data-route-loading");

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      return;
    }

    document.documentElement.setAttribute("data-route-loading", "true");
    timeoutRef.current = window.setTimeout(() => setIsLoading(false), 8000);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading]);

  return (
    <>
      {children}
      {isLoading ? (
        <div className="fixed inset-0 z-[100] cursor-progress bg-background/10 backdrop-blur-[1px]" aria-live="polite" aria-busy="true">
          <div className="absolute left-0 right-0 top-0 h-1 overflow-hidden bg-primary/10">
            <div className="h-full w-1/3 animate-[route-progress_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
          </div>
          <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-card">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            Loading...
          </div>
        </div>
      ) : null}
    </>
  );
}
