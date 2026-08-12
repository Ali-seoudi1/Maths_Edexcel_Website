"use client";

import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth";

type SignOutButtonProps = Omit<ButtonProps, "onClick" | "type"> & {
  description?: string;
  title?: string;
};

export function SignOutButton({
  children,
  description = "You will need to sign in again to access your dashboard.",
  title = "Are you sure you want to sign out?",
  ...props
}: SignOutButtonProps) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleConfirmSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        showPendingOnPress={false}
        {...props}
        onClick={() => setOpen(true)}
      >
        {children ?? (
          <>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </>
        )}
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            showPendingOnPress={false}
            disabled={isSigningOut}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            showPendingOnPress={false}
            disabled={isSigningOut}
            onClick={() => void handleConfirmSignOut()}
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Signing out
              </>
            ) : (
              "Sign out"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
