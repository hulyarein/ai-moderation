"use client";

import { useState, useEffect } from "react";
import {
  supabase,
  signInAnonymously,
  signInWithEmail,
  signOut,
  getSession,
} from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import {
  generateRandomUsername,
  getSavedUsername,
  saveUsername,
} from "@/utils/usernameGenerator";

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const { session: currentSession, error } = await getSession();

      if (error) {
        console.error("Error getting session:", error);
        setError(error.message);
      } else {
        setSession(currentSession);

        // Check if user is admin by looking at their email
        if (currentSession?.user.email?.endsWith("@admin.com")) {
          setIsAdmin(true);
        } else if (currentSession) {
          // For regular users, try to get existing username or generate a new one
          const savedUsername = getSavedUsername();
          if (savedUsername) {
            setUsername(savedUsername);
          } else {
            const newUsername = generateRandomUsername();
            saveUsername(newUsername);
            setUsername(newUsername);
          }
        }
      }

      setLoading(false);
    };

    initializeAuth();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (session?.user.email?.endsWith("@admin.com")) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);

          // If user just signed in, check for username or generate new one
          if (event === "SIGNED_IN") {
            const savedUsername = getSavedUsername();
            if (savedUsername) {
              setUsername(savedUsername);
            } else {
              const newUsername = generateRandomUsername();
              saveUsername(newUsername);
              setUsername(newUsername);
            }
          } else if (event === "SIGNED_OUT") {
            setUsername(null);
          }
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleSignInAnonymously = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await signInAnonymously();

    if (error) {
      setError(error.message);
    } else {
      setSession(data.session);

      // Generate and save a random username for the new anonymous user
      const newUsername = generateRandomUsername();
      saveUsername(newUsername);
      setUsername(newUsername);
    }

    setLoading(false);
    return { data, error };
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { data, error } = await signInWithEmail(email, password);

    if (error) {
      setError(error.message);
    } else {
      setSession(data.session);
      if (email.endsWith("@admin.com")) {
        setIsAdmin(true);
      }
    }

    setLoading(false);
    return { data, error };
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);

    const { error } = await signOut();

    if (error) {
      setError(error.message);
    } else {
      setSession(null);
      setIsAdmin(false);
      setUsername(null);
      // Clear the username from local storage on sign out
      if (typeof window !== "undefined") {
        localStorage.removeItem("randomUsername");
      }
    }

    setLoading(false);
    return { error };
  };

  return {
    session,
    user: session?.user || null,
    isAdmin,
    loading,
    error,
    username,
    signInAnonymously: handleSignInAnonymously,
    signInWithEmail: handleSignInWithEmail,
    signOut: handleSignOut,
  };
};
