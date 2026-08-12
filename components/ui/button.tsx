"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    pendingLabel?: string;
    showPendingOnPress?: boolean;
  };

function Button({
  children,
  className,
  disabled,
  onClick,
  type = "button",
  variant,
  size,
  asChild = false,
  pendingLabel = "Loading...",
  showPendingOnPress = true,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const isIconButton = size === "icon";
  const shouldShowInlinePending = isPending && !asChild;
  const canShowPressPending = showPendingOnPress && !asChild && type !== "submit";

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function startPending() {
    if (!canShowPressPending || disabled) {
      return;
    }

    setIsPending(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => setIsPending(false), 1400);
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    startPending();
  }

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || shouldShowInlinePending}
      aria-busy={isPending || undefined}
      data-pending={isPending ? "true" : undefined}
      onClick={handleClick}
      {...(!asChild ? { type } : {})}
      {...props}
    >
      {shouldShowInlinePending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {isIconButton ? <span className="sr-only">{pendingLabel}</span> : pendingLabel}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
