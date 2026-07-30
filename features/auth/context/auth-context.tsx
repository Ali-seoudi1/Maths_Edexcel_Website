"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";

import {
  initializeAuthPersistence,
  sendPasswordReset,
  signInWithEmail,
  signOutCurrentUser,
  subscribeToAuthState,
} from "../services/auth-service";
import { getUserProfile } from "../services/user-service";
import type { AuthStatus, UserProfile } from "../types";

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
  authReady: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [authReady, setAuthReady] = useState(false);

  const loadProfile = useCallback(async (user: User | null) => {
    setFirebaseUser(user);

    if (!user) {
      setProfile(null);
      setStatus("unauthenticated");
      return null;
    }

    const nextProfile = await getUserProfile(user.uid);

    if (!nextProfile || !nextProfile.active) {
      await signOutCurrentUser();
      setFirebaseUser(null);
      setProfile(null);
      setStatus("unauthenticated");
      return null;
    }

    setProfile(nextProfile);
    setStatus("authenticated");
    return nextProfile;
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    void initializeAuthPersistence()
      .then(() => {
        if (!isMounted) {
          return;
        }

        unsubscribe = subscribeToAuthState((user) => {
          if (!isMounted) {
            return;
          }

          setStatus("loading");
          setAuthReady(false);
          void loadProfile(user)
            .catch(() => {
              if (!isMounted) {
                return;
              }

              setFirebaseUser(null);
              setProfile(null);
              setStatus("unauthenticated");
            })
            .finally(() => {
              if (isMounted) {
                setAuthReady(true);
              }
            });
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setFirebaseUser(null);
        setProfile(null);
        setStatus("unauthenticated");
        setAuthReady(true);
      });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInWithEmail(email, password);
    setFirebaseUser(result.user);
    setProfile(result.profile);
    setStatus("authenticated");
    setAuthReady(true);
    return result.profile;
  }, []);

  const signOut = useCallback(async () => {
    await signOutCurrentUser();
    setFirebaseUser(null);
    setProfile(null);
    setStatus("unauthenticated");
    setAuthReady(true);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordReset(email);
  }, []);

  const refreshProfile = useCallback(
    async () => loadProfile(firebaseUser),
    [firebaseUser, loadProfile],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      status,
      authReady,
      isLoading: !authReady || status === "loading",
      signIn,
      signOut,
      resetPassword,
      refreshProfile,
    }),
    [authReady, firebaseUser, profile, refreshProfile, resetPassword, signIn, signOut, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
