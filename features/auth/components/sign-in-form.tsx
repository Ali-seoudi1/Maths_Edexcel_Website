"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { signInSchema, type SignInFormValues } from "../schemas";
import { useAuth } from "../hooks/use-auth";

function getRedirectForRole(role: "admin" | "student") {
  return role === "admin" ? "/admin" : "/dashboard";
}

export function SignInForm() {
  const router = useRouter();
  const { isLoading, profile, resetPassword, signIn, status } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (status === "authenticated" && profile) {
      router.replace(getRedirectForRole(profile.role));
    }
  }, [profile, router, status]);

  if (isLoading || status === "authenticated") {
    return (
      <Card className="border-border/70 shadow-card">
        <CardContent className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          <div className="space-y-2">
            <CardTitle className="text-xl">Loading</CardTitle>
          </div>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(values: SignInFormValues) {
    setAuthError(null);
    setResetMessage(null);

    try {
      const nextProfile = await signIn(values.email, values.password);

      router.replace(getRedirectForRole(nextProfile.role));
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "We could not sign you in.");
    }
  }

  async function handleForgotPassword() {
    const email = watch("email").trim();

    setAuthError(null);
    setResetMessage(null);

    if (!email) {
      setAuthError("Enter your email address first, then request a password reset.");
      return;
    }

    setIsResettingPassword(true);

    try {
      await resetPassword(email);
      setResetMessage("Password reset email sent if the account exists.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setIsResettingPassword(false);
    }
  }

  const isBusy = isSubmitting;

  return (
    <Card className="border-border/70 shadow-card">
      <CardHeader className="space-y-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
          <span className="text-sm font-semibold">EM</span>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Secure sign in
          </p>
          <CardTitle className="mt-2 text-2xl">Welcome back</CardTitle>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sign in with the account provided by the teacher.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="student@example.com"
              disabled={isBusy}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="pr-12"
                disabled={isBusy}
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              className="h-auto px-0 py-0 text-sm"
              disabled={isBusy || isResettingPassword}
              onClick={handleForgotPassword}
            >
              {isResettingPassword ? "Sending reset email..." : "Forgot password?"}
            </Button>
          </div>

          {authError ? (
            <div className="flex gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{authError}</p>
            </div>
          ) : null}

          {resetMessage ? (
            <div className="rounded-md border border-success/20 bg-success/5 p-3 text-sm text-success">
              {resetMessage}
            </div>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={isBusy}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Signing in
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
