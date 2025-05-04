import { supabase } from "./supabase";
import { Post } from "./socket";
import {
  emitNewPost,
  emitPostRemoved,
  emitPostReviewed,
} from "./socketEmitter";

// Create a new post in the database
export const createPost = async (
  post: Omit<Post, "id"> & { username?: string }
) => {
  // Check if there's a current session before creating a post
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData.session?.user?.id;

  // If userId doesn't match current authenticated user, this will likely fail due to RLS
  if (!currentUserId || (post.userId && post.userId !== currentUserId)) {
    console.warn(
      "Authentication mismatch: Post userId does not match authenticated user"
    );
  }

  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        ...post,
        // Ensure userId is set to the current authenticated user's ID
        userId: currentUserId || post.userId,
        // Include the username metadata
        username: post.username,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating post:", error.message);
  } else if (data) {
    // Emit the new post event via WebSocket
    try {
      emitNewPost(data);
    } catch (socketError) {
      console.error("Failed to emit new post via WebSocket:", socketError);
    }
  }

  return { data, error };
};

// Get all posts from the database
export const getPosts = async () => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("createdAt", { ascending: false });

  return { data, error };
};

// Get posts for a specific user
export const getUserPosts = async (userId: string) => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  return { data, error };
};

// Update the review status of a post
export const updatePostReviewStatus = async (
  postId: string,
  reviewed: boolean
) => {
  const { data, error } = await supabase
    .from("posts")
    .update({ reviewed })
    .eq("id", postId)
    .select()
    .single();

  if (!error && data) {
    // Emit post reviewed event via WebSocket
    try {
      emitPostReviewed(postId);
    } catch (socketError) {
      console.error("Failed to emit post reviewed via WebSocket:", socketError);
    }
  }

  return { data, error };
};

// Delete a post from the database
export const deletePost = async (postId: string) => {
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (!error) {
    // Emit post removed event via WebSocket
    try {
      emitPostRemoved(postId);
    } catch (socketError) {
      console.error("Failed to emit post removed via WebSocket:", socketError);
    }
  }

  return { error };
};
