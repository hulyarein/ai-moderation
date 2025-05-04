"use client";
import AdminPostCard from "@/components/admincard";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { getPosts, updatePostReviewStatus, deletePost } from "@/lib/database";
import { SOCKET_EVENTS, Post as PostType } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "flagged">("all");
  const { user, isAdmin, loading, signOut } = useAuth();
  const { socket, isConnected, emitPostReviewed, emitPostRemoved } =
    useSocket("ADMIN");
  const router = useRouter();

  // Check if user is authenticated and is an admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [user, isAdmin, loading, router]);

  // Fetch all posts from the database
  useEffect(() => {
    const fetchPosts = async () => {
      if (!user || !isAdmin) return;

      try {
        const { data, error } = await getPosts();

        if (error) {
          console.error("Error fetching posts:", error);
        } else if (data) {
          setPosts(data);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && isAdmin) {
      fetchPosts();
    }
  }, [user, isAdmin]);

  // Listen for new posts via websocket
  useEffect(() => {
    if (!socket) return;

    // Listen for new posts
    socket.on(SOCKET_EVENTS.NEW_POST, (post: PostType) => {
      console.log("New post received via WebSocket:", post.id);
      setPosts((prev) => [post, ...prev]);
    });

    // Listen for post removal events
    socket.on(SOCKET_EVENTS.POST_REMOVED, (postId: string) => {
      console.log("Post removal notification received:", postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    });

    // Listen for post review events
    socket.on(SOCKET_EVENTS.POST_REVIEWED, (postId: string) => {
      console.log("Post review notification received:", postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, reviewed: true } : post
        )
      );
    });

    return () => {
      socket.off(SOCKET_EVENTS.NEW_POST);
      socket.off(SOCKET_EVENTS.POST_REMOVED);
      socket.off(SOCKET_EVENTS.POST_REVIEWED);
    };
  }, [socket]);

  const handleRemovePost = async (postId: string) => {
    try {
      // Delete post from database
      const { error } = await deletePost(postId);

      if (error) {
        console.error("Error deleting post:", error);
        return;
      }

      // Update local state
      setPosts((prev) => prev.filter((post) => post.id !== postId));

      // Notify clients via websocket
      emitPostRemoved(postId);
    } catch (error) {
      console.error("Error removing post:", error);
    }
  };

  const handleMarkFalsePositive = async (postId: string) => {
    try {
      // Update post review status in database
      const { error } = await updatePostReviewStatus(postId, true);

      if (error) {
        console.error("Error updating post review status:", error);
        return;
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, reviewed: true } : post
        )
      );

      // Notify clients via websocket
      emitPostReviewed(postId);
    } catch (error) {
      console.error("Error marking post as false positive:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Calculate post statistics
  const totalPosts = posts.length;
  const textPosts = posts.filter((post) => post.type === "text").length;
  const imagePosts = posts.filter((post) => post.type === "image").length;

  // Get flagged posts (posts containing problematic content)
  const flaggedPosts = posts.filter(
    (post) =>
      post.type === "image" ||
      post.file.toLowerCase().includes("hate") ||
      post.file.toLowerCase().includes("kill") ||
      post.file.toLowerCase().includes("explicit")
  );

  if (loading || (!user && !isAdmin) || isLoading) {
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
    <div className="w-screen min-h-screen bg-gray-50 flex flex-col">
      <nav
        className="sticky top-0 z-50 shadow-md py-4 px-6 flex justify-between items-center border-b border-gray-200 transition-all duration-300"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.5)), url('https://i.pinimg.com/736x/b3/52/70/b35270039cd08b7aa332a3e95d9953af.jpg')",
          backgroundPosition: "center",
        }}
      >
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-white drop-shadow-sm">
            Admin Dashboard
          </h1>
          {isConnected ? (
            <span className="flex items-center px-3 py-1 bg-green-500 bg-opacity-20 rounded-full">
              <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-green-100 text-xs font-medium">Live</span>
            </span>
          ) : (
            <span className="flex items-center px-3 py-1 bg-red-500 bg-opacity-20 rounded-full">
              <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
              <span className="text-red-100 text-xs font-medium">Offline</span>
            </span>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="bg-white text-red-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium shadow-sm transition-all duration-200 hover:shadow-md transform hover:scale-105 active:scale-95"
        >
          Sign Out
        </button>
      </nav>

      <div className="max-w-5xl mx-auto w-full p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col">
            <span className="text-sm text-gray-500 font-medium">
              Total Posts
            </span>
            <span className="text-3xl font-bold text-gray-800">
              {totalPosts}
            </span>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col">
            <span className="text-sm text-gray-500 font-medium">
              Text Posts
            </span>
            <span className="text-3xl font-bold text-gray-800">
              {textPosts}
            </span>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col">
            <span className="text-sm text-gray-500 font-medium">
              Image Posts
            </span>
            <span className="text-3xl font-bold text-gray-800">
              {imagePosts}
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200">
          <button
            className={`py-3 px-6 font-medium text-sm ${
              activeTab === "all"
                ? "text-red-700 border-b-2 border-red-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All Posts
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm flex items-center ${
              activeTab === "flagged"
                ? "text-red-700 border-b-2 border-red-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("flagged")}
          >
            Flagged Content
            {flaggedPosts.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {flaggedPosts.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "all" ? (
          <>
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800">All Posts</h2>
              <div className="text-sm font-medium text-gray-500">
                {posts.length} {posts.length === 1 ? "post" : "posts"} total
              </div>
            </div>

            {posts.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <AdminPostCard
                    key={post.id}
                    file={post.file}
                    type={post.type}
                    username={post.username}
                    classification={
                      post.type === "image" ? "Image" : "Text Content"
                    }
                    hideActions={true} // Hide approve/remove buttons for all posts tab
                    onRemove={() => handleRemovePost(post.id)}
                    onMarkFalsePositive={() => handleMarkFalsePositive(post.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <img
                  src="/globe.svg"
                  alt="No posts"
                  className="w-24 h-24 mb-6 opacity-60"
                />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No posts available
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  There are no posts in the system yet. New posts will appear
                  here in real-time when users submit content.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800">
                Content Moderation Queue
              </h2>
              <div className="text-sm font-medium text-gray-500">
                {flaggedPosts.length}{" "}
                {flaggedPosts.length === 1 ? "post" : "posts"} flagged
              </div>
            </div>

            {flaggedPosts.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {flaggedPosts.map((post) => (
                  <AdminPostCard
                    key={post.id}
                    file={post.file}
                    type={post.type}
                    username={post.username}
                    classification={
                      post.type === "image"
                        ? "Fake Image"
                        : post.file.toLowerCase().includes("hate") ||
                          post.file.toLowerCase().includes("kill")
                        ? "Toxic Content"
                        : "Explicit Content"
                    }
                    hideActions={false} // Show approve/remove buttons for flagged content
                    onRemove={() => handleRemovePost(post.id)}
                    onMarkFalsePositive={() => handleMarkFalsePositive(post.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <img
                  src="/globe.svg"
                  alt="No posts"
                  className="w-24 h-24 mb-6 opacity-60"
                />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No posts to moderate
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  Great job! There are no posts that require moderation at this
                  time.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
