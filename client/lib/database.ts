import { supabase, RealtimePostEvent } from "./supabase";
import { getRandomProfilePicture } from "../utils/profilePictureSelector";
import {
  broadcastNewPost,
  broadcastPostRemoved,
  broadcastPostReviewed,
  broadcastPostApproved,
  broadcastPostRejected,
} from "./realtimeBroadcaster";

// Create a new post in the database
export const createPost = async (
  post: Omit<RealtimePostEvent, "id"> & { username?: string }
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
    // Broadcast the new post event via Supabase realtime
    try {
      await broadcastNewPost(data);
    } catch (realtimeError) {
      console.error(
        "Failed to broadcast new post via realtime:",
        realtimeError
      );
    }
  }

  return { data, error };
};

// Upload a post with file data
export const uploadPost = async (
  formData: FormData,
  userId: string,
  username: string,
  profilePic: string | null
) => {
  try {
    const file = formData.get("file") as File;
    const caption = formData.get("caption") as string;
    const typeValue = formData.get("type") as string;

    // Validate that type is one of the allowed values
    const type =
      typeValue === "image" || typeValue === "text"
        ? (typeValue as "image" | "text")
        : "text"; // Default to text if invalid value

    // Convert file to base64 or URL - this is a placeholder implementation
    // In a real app, you'd likely upload the file to storage and get a URL
    const fileUrl = URL.createObjectURL(file);

    // Create the post with the converted file
    // Note: caption is used in file/content or may be stored elsewhere in real implementation
    const fileContent = caption ? `${fileUrl} - ${caption}` : fileUrl;

    return await createPost({
      file: fileContent,
      type,
      userId,
      username,
      profile: profilePic || undefined,
      approved: true, // Default to approved
      reviewed: false, // Default to not reviewed
      createdAt: new Date().toISOString(), // Add the missing createdAt field
    });
  } catch (error) {
    console.error("Error in uploadPost:", error);
    return { data: null, error: { message: "Failed to upload post" } };
  }
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
    // Broadcast post reviewed event via Supabase realtime
    try {
      await broadcastPostReviewed(postId);
    } catch (realtimeError) {
      console.error(
        "Failed to broadcast post reviewed via realtime:",
        realtimeError
      );
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
    // Broadcast appropriate event based on approval status
    try {
      if (approved) {
        await broadcastPostApproved(postId);
      } else {
        await broadcastPostRejected(postId);
      }
    } catch (realtimeError) {
      console.error(
        "Failed to broadcast post status via realtime:",
        realtimeError
      );
    }
  }

  return { data, error };
};

// Delete a post from the database
export const deletePost = async (postId: string) => {
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (!error) {
    // Broadcast post removed event via Supabase realtime
    try {
      await broadcastPostRemoved(postId);
    } catch (realtimeError) {
      console.error(
        "Failed to broadcast post removed via realtime:",
        realtimeError
      );
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
    .eq("reviewed", false)
    .eq("approved", true); // Only scan posts that aren't already under review

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
          // Broadcast post reviewed event via Supabase realtime
          try {
            await broadcastPostReviewed(post.id);
          } catch (realtimeError) {
            console.error(
              "Failed to broadcast post reviewed via realtime:",
              realtimeError
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
    .eq("reviewed", false)
    .eq("approved", true); // Only scan posts that aren't already under review

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
          // Broadcast post reviewed event via Supabase realtime
          try {
            await broadcastPostReviewed(post.id);
          } catch (realtimeError) {
            console.error(
              "Failed to broadcast post reviewed via realtime:",
              realtimeError
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
