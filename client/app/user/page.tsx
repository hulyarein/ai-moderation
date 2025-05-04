"use client";
import PostCard from "@/components/postcard";
import PostModal from "@/components/postmodal";
import { createPost, getApprovedPosts } from "@/lib/database";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS, Post as PostType } from "@/lib/socket";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, Camera } from "lucide-react";
import Image from "next/image";

export default function Page() {
  const [modalOpen, setModalOpen] = useState(false);
  const [allPosts, setAllPosts] = useState<(PostType & { isNew?: boolean })[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [refreshingUsername, setRefreshingUsername] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const newPostIds = useRef<Set<string>>(new Set());

  const {
    user,
    username,
    profilePicture,
    signInAnonymously,
    refreshUsername,
    refreshProfilePicture,
  } = useAuth();
  const { socket, isConnected, emitNewPost } = useSocket("USER");

  // Helper function to refetch approved posts - wrapped in useCallback
  const fetchApprovedPosts = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await getApprovedPosts();
      if (data) {
        const sortedPosts = [...data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAllPosts(sortedPosts);
      }
    } catch (err) {
      console.error("Error fetching approved posts:", err);
    }
  }, [user]);

  // Handle anonymous authentication on page load
  useEffect(() => {
    const initAuth = async () => {
      if (!user) {
        await signInAnonymously();
      }
    };

    initAuth();
  }, [user, signInAnonymously]);

  // Fetch APPROVED posts from database when user is authenticated
  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;

      try {
        // Load only approved posts from the database
        const { data } = await getApprovedPosts();

        if (data) {
          // Sort posts by createdAt date with newest first
          const sortedPosts = [...data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAllPosts(sortedPosts);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPosts();
    }
  }, [user]);

  // Listen for post updates
  useEffect(() => {
    if (!socket) return;

    // Listen for post review events
    socket.on(SOCKET_EVENTS.POST_REVIEWED, (postId: string) => {
      console.log("Post reviewed notification received:", postId);
      setAllPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, reviewed: true } : post
        )
      );
    });

    // Listen for post approval events
    socket.on(SOCKET_EVENTS.POST_APPROVED, (postId: string) => {
      console.log("Post approved notification received:", postId);
      // If post is not already in the list, fetch it (or we could fetch all approved posts again)
      if (!allPosts.some((post) => post.id === postId)) {
        fetchApprovedPosts();
      } else {
        // Update existing post
        setAllPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, reviewed: false, approved: true }
              : post
          )
        );
      }
    });

    // Listen for post removal events
    socket.on(SOCKET_EVENTS.POST_REMOVED, (postId: string) => {
      console.log("Post removed notification received:", postId);
      setAllPosts((prev) => prev.filter((post) => post.id !== postId));
    });

    // Listen for post rejection events
    socket.on(SOCKET_EVENTS.POST_REJECTED, (postId: string) => {
      console.log("Post rejected notification received:", postId);
      // Remove rejected posts from the user view
      setAllPosts((prev) => prev.filter((post) => post.id !== postId));
    });

    // Listen for new posts from other users
    socket.on(SOCKET_EVENTS.NEW_POST, (post: PostType) => {
      console.log("New post received via WebSocket:", post.id);
      // Only add approved posts from other users (posts from this user are added directly)
      if (post.userId !== user?.id && post.approved && !post.reviewed) {
        setAllPosts((prev) => [{ ...post, isNew: true }, ...prev]);
        newPostIds.current.add(post.id);
      }
    });

    return () => {
      socket.off(SOCKET_EVENTS.POST_REVIEWED);
      socket.off(SOCKET_EVENTS.POST_REMOVED);
      socket.off(SOCKET_EVENTS.NEW_POST);
      socket.off(SOCKET_EVENTS.POST_APPROVED);
      socket.off(SOCKET_EVENTS.POST_REJECTED);
    };
  }, [socket, user, allPosts, fetchApprovedPosts]);

  // Clear the new post flag after animation completes
  useEffect(() => {
    if (newPostIds.current.size > 0) {
      const timer = setTimeout(() => {
        setAllPosts((posts) =>
          posts.map((post) => ({ ...post, isNew: false }))
        );
        newPostIds.current.clear();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [allPosts]);

  // Handle username refresh with feedback
  const handleRefreshUsername = async () => {
    setRefreshingUsername(true);
    try {
      await refreshUsername();
      setConfirmationMessage({ type: "success", message: "Username updated!" });
      setTimeout(() => setConfirmationMessage(null), 3000);
    } catch (error) {
      setConfirmationMessage({
        type: "error",
        message: error + "Failed to update username",
      });
      setTimeout(() => setConfirmationMessage(null), 3000);
    } finally {
      setRefreshingUsername(false);
    }
  };

  // Enhanced profile picture refresh with feedback
  const handleRefreshProfilePicture = async () => {
    setRefreshingProfile(true);
    try {
      await refreshProfilePicture();
      setConfirmationMessage({
        type: "success",
        message: "Profile picture updated!",
      });
      setTimeout(() => setConfirmationMessage(null), 3000);
    } catch (err) {
      setConfirmationMessage({
        type: "error",
        message: err + "Failed to update profile picture",
      });
      setTimeout(() => setConfirmationMessage(null), 3000);
    } finally {
      setRefreshingProfile(false);
    }
  };

  const handleAddPost = async (newPostData: {
    file: string;
    type: "image" | "text";
    reviewed: boolean;
  }) => {
    if (!user) return;

    try {
      // Prepare post data with username and profile picture
      const postData = {
        ...newPostData,
        userId: user.id,
        createdAt: new Date().toISOString(),
        username: username || undefined, // Include the randomly generated username
        profile: profilePicture || undefined, // Include the session profile picture
        approved: true, // Default to approved
      };

      // Save post to database
      const { data, error } = await createPost(postData);

      if (error) {
        console.error("Error creating post:", error);
        return;
      }

      if (data) {
        // Add to local state with isNew flag for animation
        newPostIds.current.add(data.id);
        setAllPosts((prevPosts) => [{ ...data, isNew: true }, ...prevPosts]);

        // Emit via websocket to all clients
        emitNewPost(data);
        console.log("New post emitted via WebSocket:", data.id);
      }
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-900"></div>
          <p className="text-lg font-medium text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddPost}
      />

      {/* Sidebar - First grid cell (col-span-1 on large screens) */}
      <div
        className="row-span-1 lg:row-span-full w-full min-h-[420px] lg:h-screen flex flex-col items-center border-0 lg:border-r p-6 sm:p-8 lg:p-12 justify-between bg-cover bg-center bg-no-repeat shadow-lg"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('https://i.pinimg.com/736x/b3/52/70/b35270039cd08b7aa332a3e95d9953af.jpg')",
          backgroundPosition: "center",
        }}
      >
        <div className="w-full flex flex-col items-center space-y-4 md:space-y-6">
          <div className="flex flex-col items-center">
            {/* Profile Picture */}
            <div className="mb-3 md:mb-4 relative">
              <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full bg-white p-1 shadow-md overflow-hidden">
                {profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt={`${username}'s profile`}
                    className="h-full w-full object-cover rounded-full"
                    width={96}
                    height={96}
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-gray-200 flex items-center justify-center">
                    <Camera size={24} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl text-center drop-shadow-md">
              Hello, {username || "User"}!
            </h1>

            {/* User control buttons in a row */}
            <div className="flex flex-row space-x-2 mt-2">
              <button
                onClick={() => handleRefreshUsername()}
                disabled={refreshingUsername}
                className="text-white text-xs sm:text-sm bg-red-900 bg-opacity-90 px-2 sm:px-3 py-1 rounded-full hover:bg-opacity-100 transition-all duration-300 flex items-center
                         btn-ripple focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-opacity-50 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow"
              >
                {refreshingUsername ? (
                  <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white rounded-full border-t-transparent mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                )}
                {refreshingUsername ? "Updating..." : "Refresh Username"}
              </button>

              <button
                onClick={handleRefreshProfilePicture}
                disabled={refreshingProfile}
                className="text-white text-xs sm:text-sm bg-red-900 bg-opacity-90 px-2 sm:px-3 py-1 rounded-full hover:bg-opacity-100 transition-all duration-300 flex items-center
                         btn-ripple focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-opacity-50 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow"
                title="Change profile picture"
              >
                {refreshingProfile ? (
                  <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white rounded-full border-t-transparent mr-1" />
                ) : (
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                )}
                {refreshingProfile ? "Updating..." : "Refresh Picture"}
              </button>
            </div>
          </div>
          <p className="text-white text-center text-xs sm:text-sm md:text-base opacity-90 max-w-md">
            Share your thoughts or images with the community. All posts are
            moderated for a safe experience.
          </p>
          <div className="mt-1 sm:mt-2 bg-black bg-opacity-30 px-3 sm:px-4 py-1 sm:py-2 rounded-full">
            {isConnected ? (
              <span className="flex items-center text-white text-xs sm:text-sm">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500 rounded-full mr-1.5 sm:mr-2 animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="flex items-center text-white text-xs sm:text-sm">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-red-500 rounded-full mr-1.5 sm:mr-2"></span>
                Connecting...
              </span>
            )}
          </div>
        </div>
        <button
          className="w-full max-w-xs sm:max-w-sm h-10 sm:h-12 md:h-14 rounded-lg border-2 border-white bg-white text-red-900 font-bold text-lg sm:text-xl lg:text-2xl 
                     hover:bg-transparent hover:text-white transition-all duration-300 ease-in-out shadow-md transform hover:scale-105 active:scale-90 
                     focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          onClick={() => setModalOpen(true)}
          data-create-post="true"
        >
          <span className="flex items-center justify-center">
            <span className="mr-2">+</span>
            Create post
          </span>
        </button>
      </div>

      {/* Content area - Second grid cell (scrollable) */}
      <div className="row-span-1 lg:row-span-full lg:h-screen lg:overflow-y-auto bg-white">
        <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 items-center w-full">
          {/* Toast notification for action confirmations */}
          {confirmationMessage && (
            <div
              className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-white shadow-lg
                ${
                  confirmationMessage.type === "success"
                    ? "bg-green-500"
                    : "bg-red-500"
                }
                animate-fade-in-out`}
            >
              <div className="flex items-center">
                <span className="mr-2">
                  {confirmationMessage.type === "success" ? "✓" : "✗"}
                </span>
                {confirmationMessage.message}
              </div>
            </div>
          )}

          {allPosts.length > 0 ? (
            <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-6 pt-2 sm:pt-4">
              {allPosts.map((post) => (
                <PostCard
                  key={post.id}
                  file={post.file}
                  type={post.type}
                  reviewed={post.reviewed}
                  approved={post.approved}
                  isOwner={post.userId === user?.id}
                  username={post.userId === user?.id ? username : post.username}
                  isNew={post.isNew}
                  profile={
                    post.userId === user?.id
                      ? profilePicture || undefined
                      : post.profile
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto text-gray-500 p-4 sm:p-8 rounded-xl bg-gray-50 border border-gray-100 mt-4 sm:mt-8">
              <Image
                src="/file.svg"
                alt="No posts"
                width={80}
                height={80}
                className="mb-3 sm:mb-4 opacity-50"
              />
              <p className="text-base sm:text-lg font-medium text-center">
                No posts available. Be the first to create a post!
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-3 sm:mt-4 px-4 sm:px-6 py-1.5 sm:py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 
                transition-all duration-300 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-opacity-50"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2">+</span>
                  Create Now
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
