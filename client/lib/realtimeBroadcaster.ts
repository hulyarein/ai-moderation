import { createClient } from "@supabase/supabase-js";
import { REALTIME_EVENTS, RealtimePostEvent } from "./supabase";

// Create a server-side Supabase client for broadcasting events
// Note: This should be used on the server side (in API routes) only
const serverSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // This should be a service key for admin access
);

const REALTIME_CHANNEL = "post-events";

// Function to broadcast a new post event
export async function broadcastNewPost(post: RealtimePostEvent) {
  try {
    const result = await serverSupabase.channel(REALTIME_CHANNEL).send({
      type: "broadcast",
      event: REALTIME_EVENTS.NEW_POST,
      payload: post,
    });

    return result;
  } catch (error) {
    console.error("Error broadcasting new post:", error);
    throw error;
  }
}

// Function to broadcast a post reviewed event
export async function broadcastPostReviewed(postId: string) {
  try {
    const result = await serverSupabase.channel(REALTIME_CHANNEL).send({
      type: "broadcast",
      event: REALTIME_EVENTS.POST_REVIEWED,
      payload: { id: postId },
    });

    return result;
  } catch (error) {
    console.error("Error broadcasting post reviewed:", error);
    throw error;
  }
}

// Function to broadcast a post approved event
export async function broadcastPostApproved(postId: string) {
  try {
    const result = await serverSupabase.channel(REALTIME_CHANNEL).send({
      type: "broadcast",
      event: REALTIME_EVENTS.POST_APPROVED,
      payload: { id: postId },
    });

    return result;
  } catch (error) {
    console.error("Error broadcasting post approved:", error);
    throw error;
  }
}

// Function to broadcast a post rejected event
export async function broadcastPostRejected(postId: string) {
  try {
    const result = await serverSupabase.channel(REALTIME_CHANNEL).send({
      type: "broadcast",
      event: REALTIME_EVENTS.POST_REJECTED,
      payload: { id: postId },
    });

    return result;
  } catch (error) {
    console.error("Error broadcasting post rejected:", error);
    throw error;
  }
}

// Function to broadcast a post removed event
export async function broadcastPostRemoved(postId: string) {
  try {
    const result = await serverSupabase.channel(REALTIME_CHANNEL).send({
      type: "broadcast",
      event: REALTIME_EVENTS.POST_REMOVED,
      payload: { id: postId },
    });

    return result;
  } catch (error) {
    console.error("Error broadcasting post removed:", error);
    throw error;
  }
}
