import { createClient } from "@supabase/supabase-js";

// These environment variables need to be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Function to sign in anonymously for regular users
export const signInAnonymously = async () => {
  const { data, error } = await supabase.auth.signInAnonymously();
  return { data, error };
};

// Function to sign in with email and password for admin
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

// Function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Function to get the current session
export const getSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return { session, error };
};

// Realtime client exports
export type RealtimePostEvent = {
  id: string;
  file: string;
  type: "image" | "text";
  userId?: string;
  username?: string;
  profile?: string;
  reviewed: boolean;
  approved: boolean;
  createdAt: string;
};

// Constants for realtime events that were in socket.ts
export enum REALTIME_EVENTS {
  NEW_POST = "new_post",
  POST_REMOVED = "post_removed",
  POST_REVIEWED = "post_reviewed",
  POST_APPROVED = "post_approved",
  POST_REJECTED = "post_rejected",
  POSTS_UPDATE = "posts_update",
}

// Type for realtime event types for type safety
export type RealtimeEventType =
  | REALTIME_EVENTS.NEW_POST
  | REALTIME_EVENTS.POST_REMOVED
  | REALTIME_EVENTS.POST_REVIEWED
  | REALTIME_EVENTS.POST_APPROVED
  | REALTIME_EVENTS.POST_REJECTED
  | REALTIME_EVENTS.POSTS_UPDATE;

// Constants for client types that were in socket.ts
export enum CLIENT_TYPES {
  ADMIN = "admin",
  USER = "user",
}
