import { supabase } from "./supabase";
import { Post } from "./socket";
import {
  emitNewPost,
  emitPostRemoved,
  emitPostReviewed,
  emitPostApproved,
  emitPostRejected,
} from "./socketEmitter";
import { getRandomProfilePicture } from "../utils/profilePictureSelector";

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

  // Get a random profile picture
  const randomProfilePicture = getRandomProfilePicture();

  // Set default values if not provided
  const postWithDefaults = {
    ...post,
    approved: post.approved !== undefined ? post.approved : true, // Default to approved
    userId: currentUserId || post.userId,
    username: post.username,
    profile: post.profile || randomProfilePicture, // Use provided profile or random one
  };

  const { data, error } = await supabase
    .from("posts")
    .insert([postWithDefaults])
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

// Get approved posts for user view
export const getApprovedPosts = async () => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("approved", true)
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

// Update the approval status of a post
export const updatePostApprovalStatus = async (
  postId: string,
  approved: boolean
) => {
  const { data, error } = await supabase
    .from("posts")
    .update({ approved, reviewed: false }) // Set reviewed to false as it's been processed
    .eq("id", postId)
    .select()
    .single();

  if (!error && data) {
    // Emit appropriate event based on approval status
    try {
      if (approved) {
        emitPostApproved(postId);
      } else {
        emitPostRejected(postId);
      }
    } catch (socketError) {
      console.error("Failed to emit post status via WebSocket:", socketError);
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

// Check text content for toxicity
export const checkTextToxicity = async (text: string) => {
  try {
    const response = await fetch(
      "https://aliac-ai-moderation-backend.wetooa.me/predict-toxicity",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking text toxicity:", error);
    return null;
  }
};

// Bulk process posts for toxicity
export const detectToxicPosts = async () => {
  // Get all text posts that are not already being reviewed
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("type", "text")
    .eq("reviewed", false); // Only scan posts that aren't already under review

  if (error) {
    console.error("Error fetching posts for toxicity check:", error);
    return { success: false, processed: 0, toxic: 0, error: error.message };
  }

  if (!posts || posts.length === 0) {
    return { success: true, processed: 0, toxic: 0 };
  }

  let toxic = 0;

  // Process each post for toxicity
  for (const post of posts) {
    try {
      const result = await checkTextToxicity(post.file);

      if (result && result.is_toxic) {
        // Mark toxic posts for review
        const { error: updateError } = await supabase
          .from("posts")
          .update({ reviewed: true })
          .eq("id", post.id);

        if (!updateError) {
          toxic++;
          // Emit post reviewed event via WebSocket
          try {
            emitPostReviewed(post.id);
          } catch (socketError) {
            console.error(
              "Failed to emit post reviewed via WebSocket:",
              socketError
            );
          }
        }
      }
    } catch (processError) {
      console.error(`Error processing post ${post.id}:`, processError);
    }
  }

  return {
    success: true,
    processed: posts.length,
    toxic,
  };
};

// Check image for deepfake
export const checkImageDeepfake = async (imageUrl: string) => {
  try {
    const response = await fetch(
      "https://aliac-ai-moderation-backend.wetooa.me/predict-deepfake-url",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_url: imageUrl }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking image for deepfake:", error);
    return null;
  }
};

// Bulk process image posts for deepfake detection
export const detectDeepfakeImages = async () => {
  // Get all image posts that are not already being reviewed
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("type", "image")
    .eq("reviewed", false); // Only scan posts that aren't already under review

  if (error) {
    console.error("Error fetching posts for deepfake check:", error);
    return { success: false, processed: 0, deepfakes: 0, error: error.message };
  }

  if (!posts || posts.length === 0) {
    return { success: true, processed: 0, deepfakes: 0 };
  }

  let deepfakes = 0;

  // Process each image post for deepfake detection
  for (const post of posts) {
    try {
      const result = await checkImageDeepfake(post.file);

      if (result && result.is_deepfake) {
        // Mark deepfake images for review
        const { error: updateError } = await supabase
          .from("posts")
          .update({ reviewed: true })
          .eq("id", post.id);

        if (!updateError) {
          deepfakes++;
          // Emit post reviewed event via WebSocket
          try {
            emitPostReviewed(post.id);
          } catch (socketError) {
            console.error(
              "Failed to emit post reviewed via WebSocket:",
              socketError
            );
          }
        }
      }
    } catch (processError) {
      console.error(`Error processing post ${post.id}:`, processError);
    }
  }

  return {
    success: true,
    processed: posts.length,
    deepfakes,
  };
};

// Process both text and image posts
export const moderateAllContent = async () => {
  // Run both detection processes
  const toxicityResult = await detectToxicPosts();
  const deepfakeResult = await detectDeepfakeImages();

  // Combine results
  return {
    success: toxicityResult.success && deepfakeResult.success,
    processed: {
      text: toxicityResult.processed || 0,
      images: deepfakeResult.processed || 0,
      total: (toxicityResult.processed || 0) + (deepfakeResult.processed || 0),
    },
    flagged: {
      toxic: toxicityResult.toxic || 0,
      deepfakes: deepfakeResult.deepfakes || 0,
      total: (toxicityResult.toxic || 0) + (deepfakeResult.deepfakes || 0),
    },
    error: toxicityResult.error || deepfakeResult.error,
    timestamp: new Date(),
  };
};
