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
  refreshUsername as refreshRandomUsername,
} from "@/utils/usernameGenerator";
import {
  getSavedProfilePicture,
  saveProfilePicture,
  fetchRandomProfilePicture,
  refreshProfilePicture,
} from "@/utils/profilePictureSelector";

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

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

          // Get existing profile picture or fetch a new one
          const savedProfilePicture = getSavedProfilePicture();
          if (savedProfilePicture) {
            setProfilePicture(savedProfilePicture);
          } else {
            try {
              const newProfilePicture = await fetchRandomProfilePicture();
              saveProfilePicture(newProfilePicture);
              setProfilePicture(newProfilePicture);
            } catch (error) {
              console.error("Error fetching profile picture:", error);
              setProfilePicture("/profiles/default_profile.jpeg");
            }
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

          // If user just signed in, check for username/profile or generate new ones
          if (event === "SIGNED_IN") {
            const savedUsername = getSavedUsername();
            if (savedUsername) {
              setUsername(savedUsername);
            } else {
              const newUsername = generateRandomUsername();
              saveUsername(newUsername);
              setUsername(newUsername);
            }

            const savedProfilePicture = getSavedProfilePicture();
            if (savedProfilePicture) {
              setProfilePicture(savedProfilePicture);
            } else {
              try {
                const newProfilePicture = await fetchRandomProfilePicture();
                saveProfilePicture(newProfilePicture);
                setProfilePicture(newProfilePicture);
              } catch (error) {
                console.error("Error fetching profile picture:", error);
                setProfilePicture("/profiles/default_profile.jpeg");
              }
            }
          } else if (event === "SIGNED_OUT") {
            setUsername(null);
            setProfilePicture(null);
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

      // Generate and save a random profile picture
      try {
        const newProfilePicture = await fetchRandomProfilePicture();
        saveProfilePicture(newProfilePicture);
        setProfilePicture(newProfilePicture);
      } catch (error) {
        console.error("Error fetching profile picture:", error);
        setProfilePicture("/profiles/default_profile.jpeg");
      }
    }

    setLoading(false);
    return { data, error };
  };

  // Function to refresh the current username
  const handleRefreshUsername = () => {
    if (session && !isAdmin) {
      const newUsername = refreshRandomUsername();
      setUsername(newUsername);
      return newUsername;
    }
    return null;
  };

  // Function to refresh the current profile picture
  const handleRefreshProfilePicture = async () => {
    if (session && !isAdmin) {
      try {
        const newProfilePicture = await refreshProfilePicture();
        setProfilePicture(newProfilePicture);
        return newProfilePicture;
      } catch (error) {
        console.error("Error refreshing profile picture:", error);
        return null;
      }
    }
    return null;
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
      setProfilePicture(null);
      // Clear the username and profile picture from local storage on sign out
      if (typeof window !== "undefined") {
        localStorage.removeItem("randomUsername");
        localStorage.removeItem("profilePicture");
      }
    }

    setLoading(false);
    return { error };
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { data, error } = await signInWithEmail(email, password);

    if (error) {
      setError(error.message);
    } else {
      setSession(data.session);
      // Check if user is admin
      if (data.session?.user.email?.endsWith("@admin.com")) {
        setIsAdmin(true);
      } else {
        // For regular users, try to get existing username or generate a new one
        const savedUsername = getSavedUsername();
        if (savedUsername) {
          setUsername(savedUsername);
        } else {
          const newUsername = generateRandomUsername();
          saveUsername(newUsername);
          setUsername(newUsername);
        }

        // Get existing profile picture or fetch a new one
        const savedProfilePicture = getSavedProfilePicture();
        if (savedProfilePicture) {
          setProfilePicture(savedProfilePicture);
        } else {
          try {
            const newProfilePicture = await fetchRandomProfilePicture();
            saveProfilePicture(newProfilePicture);
            setProfilePicture(newProfilePicture);
          } catch (error) {
            console.error("Error fetching profile picture:", error);
            setProfilePicture("/profiles/default_profile.jpeg");
          }
        }
      }
    }

    setLoading(false);
    return { data, error };
  };

  return {
    session,
    user: session?.user || null,
    userId: session?.user?.id || null,
    isAdmin,
    isLoading: loading,
    error,
    username,
    profilePicture: profilePicture as string | null,
    avatarUrl: profilePicture as string | null,
    signInAnonymously: handleSignInAnonymously,
    signInWithEmail: handleSignInWithEmail,
    signOut: handleSignOut,
    refreshUsername: handleRefreshUsername,
    refreshProfilePicture: handleRefreshProfilePicture,
  };
};
