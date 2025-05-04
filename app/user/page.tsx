"use client";
import PostCard from "@/components/postcard";
import PostModal from "@/components/postmodal";
import { createPost, getUserPosts, getPosts } from "@/lib/database";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS, Post as PostType } from "@/lib/socket";
import React, { useState, useEffect, useRef } from "react";

export default function Page() {
  const [modalOpen, setModalOpen] = useState(false);
  const [allPosts, setAllPosts] = useState<(PostType & { isNew?: boolean })[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const newPostIds = useRef<Set<string>>(new Set());

  const { user, username, signInAnonymously, loading: authLoading } = useAuth();
  const { socket, isConnected, emitNewPost } = useSocket("USER");

  // Handle anonymous authentication on page load
  useEffect(() => {
    const initAuth = async () => {
      if (!user) {
        await signInAnonymously();
      }
    };

    initAuth();
  }, [user, signInAnonymously]);

  // Fetch ALL posts from database when user is authenticated
  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;

      try {
        // Load ALL posts from the database
        const { data, error } = await getPosts();

        if (error) {
          console.error("Error fetching posts:", error);
        } else if (data) {
          // Sort posts by createdAt date with newest first
          const sortedPosts = [...data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAllPosts(sortedPosts);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
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

    // Listen for post removal events
    socket.on(SOCKET_EVENTS.POST_REMOVED, (postId: string) => {
      console.log("Post removed notification received:", postId);
      setAllPosts((prev) => prev.filter((post) => post.id !== postId));
    });

    // Listen for new posts from other users
    socket.on(SOCKET_EVENTS.NEW_POST, (post: PostType) => {
      console.log("New post received via WebSocket:", post.id);
      // Only add posts from other users (posts from this user are added directly)
      if (post.userId !== user?.id) {
        setAllPosts((prev) => [{ ...post, isNew: true }, ...prev]);
        newPostIds.current.add(post.id);
      }
    });

    return () => {
      socket.off(SOCKET_EVENTS.POST_REVIEWED);
      socket.off(SOCKET_EVENTS.POST_REMOVED);
      socket.off(SOCKET_EVENTS.NEW_POST);
    };
  }, [socket, user]);

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

  const handleAddPost = async (newPostData: {
    file: string;
    type: "image" | "text";
    reviewed: boolean;
  }) => {
    if (!user) return;

    try {
      // Prepare post data with username
      const postData = {
        ...newPostData,
        userId: user.id,
        createdAt: new Date().toISOString(),
        username: username || undefined, // Include the randomly generated username
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
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-900"></div>
          <p className="text-lg font-medium text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row w-full transition-all duration-300">
      <PostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddPost}
      />
      <div
        className="w-full lg:w-2/5 h-64 lg:h-screen flex flex-col items-center border-0 rounded-none lg:rounded-tr-3xl lg:rounded-br-3xl p-8 lg:p-12 justify-between bg-cover bg-center bg-no-repeat shadow-lg transition-all duration-300 ease-in-out"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('https://i.pinimg.com/736x/b3/52/70/b35270039cd08b7aa332a3e95d9953af.jpg')",
          backgroundPosition: "center",
        }}
      >
        <div className="w-full flex flex-col items-center space-y-4">
          <h1 className="text-white font-bold text-3xl lg:text-4xl text-center drop-shadow-md">
            Welcome, {username || "User"}!
          </h1>
          <p className="text-white text-center text-sm md:text-base opacity-90 max-w-md">
            Share your thoughts or images with the community. All posts are
            moderated for a safe experience.
          </p>
          <div className="mt-2 bg-black bg-opacity-30 px-4 py-2 rounded-full">
            {isConnected ? (
              <span className="flex items-center text-white">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="flex items-center text-white">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                Connecting...
              </span>
            )}
          </div>
        </div>
        <button
          className="w-full sm:w-2/3 h-14 rounded-lg border-2 border-white bg-white text-red-900 font-bold text-xl lg:text-2xl 
                     hover:bg-transparent hover:text-white transition-all duration-300 ease-in-out shadow-md transform hover:scale-105 active:scale-95"
          onClick={() => setModalOpen(true)}
        >
          Create post
        </button>
      </div>
      <div className="flex flex-col gap-6 p-6 sm:p-8 items-center w-full lg:w-3/5 bg-white h-[calc(100vh-16rem)] lg:h-screen overflow-y-auto">
        {allPosts.length > 0 ? (
          <div className="w-full max-w-xl space-y-6 pb-6">
            {allPosts.map((post) => (
              <PostCard
                key={post.id}
                file={post.file}
                type={post.type}
                reviewed={post.reviewed}
                isOwner={post.userId === user?.id}
                username={post.userId === user?.id ? username : post.username}
                isNew={post.isNew}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full max-w-xl text-gray-500 p-8 rounded-xl bg-gray-50 border border-gray-100">
            <img
              src="/file.svg"
              alt="No posts"
              className="w-20 h-20 mb-4 opacity-50"
            />
            <p className="text-lg font-medium text-center">
              No posts available. Be the first to create a post!
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
            >
              Create Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
