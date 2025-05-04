"use client";
import AdminPostCard from "@/components/admincard";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import {
  getPosts,
  updatePostReviewStatus,
  updatePostApprovalStatus,
  deletePost,
  detectToxicPosts,
  detectDeepfakeImages,
  moderateAllContent,
} from "@/lib/database";
import { SOCKET_EVENTS, Post as PostType } from "@/lib/socket";
import { getRandomProfilePicture } from "@/utils/profilePictureSelector";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Shield,
  AlertCircle,
  LogOut,
  CheckCircle,
  RefreshCw,
  Search,
} from "lucide-react";

// Create a map to store profile pictures for each username
const userProfileMap = new Map<string, string>();

export default function Page() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "flagged" | "reviewed">(
    "all"
  );
  const [isScanningToxicity, setIsScanningToxicity] = useState(false);
  const [isScanningDeepfakes, setIsScanningDeepfakes] = useState(false);
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [secondsUntilNextCheck, setSecondsUntilNextCheck] =
    useState<number>(60);
  const [isModeratorPaused, setIsModeratorPaused] = useState<boolean>(false);
  const [moderationLogs, setModerationLogs] = useState<
    Array<{
      message: string;
      timestamp: Date;
    }>
  >([]);
  const [scanResult, setScanResult] = useState<{
    success?: boolean;
    processed?: number;
    toxic?: number;
    deepfakes?: number;
    processed?: {
      text?: number;
      images?: number;
      total?: number;
    };
    flagged?: {
      toxic?: number;
      deepfakes?: number;
      total?: number;
    };
    error?: string;
    timestamp?: Date;
  } | null>(null);
  const [moderationAlert, setModerationAlert] = useState<{
    timestamp: Date;
    toxicPosts: number;
    deepfakeImages: number;
    total: number;
    isNew: boolean;
    read: boolean;
  } | null>(null);
  const { user, isAdmin, loading, signOut } = useAuth();
  const { socket, isConnected, emitPostReviewed, emitPostRemoved } =
    useSocket("ADMIN");
  const router = useRouter();

  // Function to get or create a profile picture for a username
  const getProfilePictureForUser = (username: string): string => {
    if (!userProfileMap.has(username)) {
      // Generate a new profile picture path and store it in the map
      userProfileMap.set(username, getRandomProfilePicture());
    }
    return userProfileMap.get(username) || "/profiles/default_profile.jpeg";
  };

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

    // Listen for automated moderation alerts
    socket.on(
      SOCKET_EVENTS.MODERATION_ALERT,
      (data: {
        timestamp: Date;
        toxicPosts: number;
        deepfakeImages: number;
        total: number;
      }) => {
        console.log("Automated moderation alert received:", data);

        // Show notification to admin
        setModerationAlert({
          ...data,
          isNew: true,
          read: false,
        });

        // Refresh posts to get the updated status
        const fetchPosts = async () => {
          const { data, error } = await getPosts();
          if (!error && data) {
            setPosts(data);
          }
        };

        fetchPosts();
      }
    );

    // Listen for moderation scan started events
    socket.on(
      SOCKET_EVENTS.MODERATION_SCAN_STARTED,
      (data: { timestamp: Date; message: string }) => {
        // Add new log entry at the beginning of the array (newest first)
        setModerationLogs((prevLogs) => [
          {
            message: data.message,
            timestamp: new Date(data.timestamp),
          },
          ...prevLogs.slice(0, 9), // Keep only the 10 most recent logs
        ]);
      }
    );

    // Listen for timer updates
    socket.on(
      SOCKET_EVENTS.MODERATION_TIMER_UPDATE,
      (data: { secondsRemaining: number; isActive: boolean }) => {
        setSecondsUntilNextCheck(data.secondsRemaining);
        setIsModeratorPaused(!data.isActive);
      }
    );

    // Listen for moderation status updates
    socket.on(
      SOCKET_EVENTS.MODERATION_STATUS_UPDATE,
      (data: { isPaused: boolean }) => {
        setIsModeratorPaused(data.isPaused);
      }
    );

    return () => {
      socket.off(SOCKET_EVENTS.NEW_POST);
      socket.off(SOCKET_EVENTS.POST_REMOVED);
      socket.off(SOCKET_EVENTS.POST_REVIEWED);
      socket.off(SOCKET_EVENTS.MODERATION_ALERT);
      socket.off(SOCKET_EVENTS.MODERATION_SCAN_STARTED);
      socket.off(SOCKET_EVENTS.MODERATION_TIMER_UPDATE);
      socket.off(SOCKET_EVENTS.MODERATION_STATUS_UPDATE);
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

  const handleApprovePost = async (postId: string) => {
    try {
      // Update post approval status in database to approve
      const { error } = await updatePostApprovalStatus(postId, true);

      if (error) {
        console.error("Error approving post:", error);
        return;
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, reviewed: false, approved: true }
            : post
        )
      );
    } catch (error) {
      console.error("Error approving post:", error);
    }
  };

  const handleRejectPost = async (postId: string) => {
    try {
      // Update post approval status in database to reject
      const { error } = await updatePostApprovalStatus(postId, false);

      if (error) {
        console.error("Error rejecting post:", error);
        return;
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, reviewed: false, approved: false }
            : post
        )
      );
    } catch (error) {
      console.error("Error rejecting post:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Handle toxicity detection
  const handleScanForToxicity = async () => {
    setIsScanningToxicity(true);
    setScanResult(null);

    try {
      const result = await detectToxicPosts();
      setScanResult({
        ...result,
        timestamp: new Date(),
      });

      // Refresh the posts list to show updated review statuses
      if (result.success && result.toxic > 0) {
        const { data, error } = await getPosts();
        if (!error && data) {
          setPosts(data);
        }
      }
    } catch (error) {
      console.error("Error during toxicity scan:", error);
      setScanResult({
        success: false,
        error: "An unexpected error occurred during the scan",
        timestamp: new Date(),
      });
    } finally {
      setIsScanningToxicity(false);
    }
  };

  // Handle deepfake image detection
  const handleScanForDeepfakes = async () => {
    setIsScanningDeepfakes(true);
    setScanResult(null);

    try {
      const result = await detectDeepfakeImages();
      setScanResult({
        ...result,
        timestamp: new Date(),
      });

      // Refresh the posts list to show updated review statuses
      if (result.success && result.deepfakes > 0) {
        const { data, error } = await getPosts();
        if (!error && data) {
          setPosts(data);
        }
      }
    } catch (error) {
      console.error("Error during deepfake scan:", error);
      setScanResult({
        success: false,
        error: "An unexpected error occurred during the deepfake scan",
        timestamp: new Date(),
      });
    } finally {
      setIsScanningDeepfakes(false);
    }
  };

  // Handle combined moderation of all content
  const handleModerateAll = async () => {
    setIsScanningAll(true);
    setScanResult(null);

    try {
      const result = await moderateAllContent();
      setScanResult({
        ...result,
      });

      // Refresh the posts list to show updated review statuses
      if (result.success && result.flagged.total > 0) {
        const { data, error } = await getPosts();
        if (!error && data) {
          setPosts(data);
        }
      }
    } catch (error) {
      console.error("Error during content moderation:", error);
      setScanResult({
        success: false,
        error: "An unexpected error occurred during content moderation",
        timestamp: new Date(),
      });
    } finally {
      setIsScanningAll(false);
    }
  };

  // Calculate post statistics
  const totalPosts = posts.length;
  const textPosts = posts.filter((post) => post.type === "text").length;
  const imagePosts = posts.filter((post) => post.type === "image").length;

  // Get flagged posts (posts containing problematic content)
  const flaggedPosts = posts.filter(
    (post) =>
      !post.approved || // Include posts marked as not approved
      (post.type === "image" && post.approved !== true) || // Only include image posts that haven't been explicitly approved
      post.file.toLowerCase().includes("hate") ||
      post.file.toLowerCase().includes("kill") ||
      post.file.toLowerCase().includes("explicit")
  );

  // Get posts that are under review
  const reviewedPosts = posts.filter((post) => post.reviewed);

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
        <div className="flex items-center gap-4">
          {moderationAlert && moderationAlert.isNew && (
            <div
              className="bg-red-600 text-white px-4 py-2 rounded-md shadow-md flex items-center gap-2 animate-pulse cursor-pointer"
              onClick={() => {
                setActiveTab("reviewed");
                setModerationAlert((prev) =>
                  prev ? { ...prev, isNew: false, read: true } : null
                );
              }}
            >
              <AlertCircle size={18} />
              <div>
                <p className="font-medium text-sm">
                  Automated Moderation Alert
                </p>
                <p className="text-xs">
                  {moderationAlert.total} new items flagged for review
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="bg-white text-red-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium shadow-sm transition-all duration-200 hover:shadow-md transform hover:scale-105 active:scale-95"
          >
            Sign Out
          </button>
        </div>
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

        {/* AI Moderation Control */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  AI Content Moderation
                </h2>
                <p className="text-sm text-gray-500">
                  Automatically scan content for policy violations
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
                <button
                  onClick={handleScanForToxicity}
                  disabled={
                    isScanningToxicity ||
                    isScanningDeepfakes ||
                    isScanningAll ||
                    textPosts === 0
                  }
                  className={`px-4 py-2 rounded-md font-medium shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    isScanningToxicity ||
                    textPosts === 0 ||
                    isScanningDeepfakes ||
                    isScanningAll
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-red-700 text-white hover:bg-red-800 hover:shadow-md transform hover:scale-105 active:scale-95"
                  }`}
                >
                  {isScanningToxicity ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      <span>Scan Text</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleScanForDeepfakes}
                  disabled={
                    isScanningToxicity ||
                    isScanningDeepfakes ||
                    isScanningAll ||
                    imagePosts === 0
                  }
                  className={`px-4 py-2 rounded-md font-medium shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    isScanningDeepfakes ||
                    imagePosts === 0 ||
                    isScanningToxicity ||
                    isScanningAll
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-700 text-white hover:bg-blue-800 hover:shadow-md transform hover:scale-105 active:scale-95"
                  }`}
                >
                  {isScanningDeepfakes ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      <span>Scan Images</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleModerateAll}
                  disabled={
                    isScanningToxicity ||
                    isScanningDeepfakes ||
                    isScanningAll ||
                    (textPosts === 0 && imagePosts === 0)
                  }
                  className={`px-4 py-2 rounded-md font-medium shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    isScanningAll ||
                    (textPosts === 0 && imagePosts === 0) ||
                    isScanningToxicity ||
                    isScanningDeepfakes
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-purple-700 text-white hover:bg-purple-800 hover:shadow-md transform hover:scale-105 active:scale-95"
                  }`}
                >
                  {isScanningAll ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Scanning All...</span>
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      <span>Moderate All</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Automated Moderation Timer Panel */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
              <div className="flex items-center mb-3 sm:mb-0">
                <div className="mr-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      isModeratorPaused ? "bg-gray-200" : "bg-blue-100"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        isModeratorPaused ? "text-gray-500" : "text-blue-700"
                      }`}
                    >
                      {isModeratorPaused ? "⏸️" : secondsUntilNextCheck}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    Automated Checks
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isModeratorPaused
                      ? "Paused - No automatic checks will run"
                      : `Next check in ${secondsUntilNextCheck} ${
                          secondsUntilNextCheck === 1 ? "second" : "seconds"
                        }`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (socket && isConnected) {
                    socket.emit(
                      SOCKET_EVENTS.TOGGLE_MODERATION,
                      !isModeratorPaused
                    );
                  }
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors w-full sm:w-auto ${
                  isModeratorPaused
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                }`}
              >
                {isModeratorPaused ? "Resume Auto-Checks" : "Pause Auto-Checks"}
              </button>
            </div>

            {scanResult && (
              <div
                className={`p-3 rounded-md text-sm mt-3 ${
                  scanResult.success
                    ? "bg-green-50 text-green-800 border border-green-100"
                    : "bg-red-50 text-red-800 border border-red-100"
                }`}
              >
                {scanResult.success ? (
                  <div className="flex items-start">
                    <CheckCircle
                      size={18}
                      className="mr-2 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="font-medium">Scan completed successfully</p>
                      {scanResult.processed && !scanResult.processed.total && (
                        <p>
                          Processed {scanResult.processed}{" "}
                          {isScanningDeepfakes ? "image" : "text"} posts, found{" "}
                          {isScanningDeepfakes
                            ? scanResult.deepfakes
                            : scanResult.toxic}{" "}
                          with potentially harmful content.
                        </p>
                      )}
                      {scanResult.processed && scanResult.processed.total && (
                        <p>
                          Processed {scanResult.processed.total} posts (
                          {scanResult.processed.text} text,{" "}
                          {scanResult.processed.images} images), found{" "}
                          {scanResult.flagged.total} with potentially harmful
                          content ({scanResult.flagged.toxic} toxic text,{" "}
                          {scanResult.flagged.deepfakes} deepfake images).
                        </p>
                      )}
                      {((scanResult.toxic && scanResult.toxic > 0) ||
                        (scanResult.deepfakes && scanResult.deepfakes > 0) ||
                        (scanResult.flagged &&
                          scanResult.flagged.total > 0)) && (
                        <p className="mt-1 font-medium">
                          These posts have been marked for review in the
                          moderation queue.
                        </p>
                      )}
                      <p className="text-xs text-green-600 mt-1">
                        {scanResult.timestamp &&
                          `Last scan: ${scanResult.timestamp.toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <AlertCircle
                      size={18}
                      className="mr-2 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="font-medium">Scan failed</p>
                      <p>{scanResult.error || "An unknown error occurred."}</p>
                      <p className="text-xs text-red-600 mt-1">
                        {scanResult.timestamp &&
                          `Error time: ${scanResult.timestamp.toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Moderation Activity Log */}
            {moderationLogs.length > 0 && (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">
                    Moderation Activity Log
                  </h3>
                </div>
                <div className="max-h-36 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                      {moderationLogs.map((log, index) => (
                        <tr
                          key={index}
                          className={index === 0 ? "bg-blue-50" : ""}
                        >
                          <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">
                            {log.timestamp.toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-2 whitespace-normal text-gray-700">
                            {log.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
          <button
            className={`py-3 px-6 font-medium text-sm flex items-center ${
              activeTab === "reviewed"
                ? "text-red-700 border-b-2 border-red-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("reviewed")}
          >
            Content Moderation
            {reviewedPosts.length > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {reviewedPosts.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "all" ? (
          <>
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800">All Posts</h2>
              <div className="text-sm font-medium text-gray-500">
                {posts.filter((post) => post.approved !== false).length}{" "}
                {posts.filter((post) => post.approved !== false).length === 1
                  ? "post"
                  : "posts"}{" "}
                total
              </div>
            </div>

            {posts.filter((post) => post.approved !== false).length > 0 ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {posts
                  .filter((post) => post.approved !== false)
                  .map((post) => (
                    <AdminPostCard
                      key={post.id}
                      file={post.file}
                      type={post.type}
                      username={post.username}
                      profilePicture={post.profile}
                      reviewed={post.reviewed}
                      approved={post.approved}
                      classification={
                        post.type === "image" ? "Image" : "Text Content"
                      }
                      hideActions={true} // Hide approve/remove buttons for all posts tab
                      onRemove={() => handleRemovePost(post.id)}
                      onMarkFalsePositive={() =>
                        handleMarkFalsePositive(post.id)
                      }
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
        ) : activeTab === "flagged" ? (
          <>
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800">
                Potentially Harmful Content
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
                    profilePicture={post.profile}
                    reviewed={post.reviewed}
                    approved={post.approved}
                    classification={
                      post.type === "image"
                        ? "Fake Image"
                        : post.file.toLowerCase().includes("hate") ||
                          post.file.toLowerCase().includes("kill")
                        ? "Toxic Content"
                        : "Explicit Content"
                    }
                    hideActions={true} // Hide actions for flagged content
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
                  No flagged content
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  Great job! There are no posts that require flagging at this
                  time.
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
                {reviewedPosts.length}{" "}
                {reviewedPosts.length === 1 ? "post" : "posts"} under review
              </div>
            </div>

            {reviewedPosts.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {reviewedPosts.map((post) => (
                  <AdminPostCard
                    key={post.id}
                    file={post.file}
                    type={post.type}
                    username={post.username}
                    profilePicture={post.profile}
                    reviewed={post.reviewed}
                    approved={post.approved}
                    classification={
                      post.type === "image"
                        ? "Fake Image"
                        : post.file.toLowerCase().includes("hate") ||
                          post.file.toLowerCase().includes("kill")
                        ? "Toxic Content"
                        : "Explicit Content"
                    }
                    hideActions={false} // Show safe/unsafe buttons for reviewed content
                    onRemove={() => handleRemovePost(post.id)}
                    onMarkFalsePositive={() => handleMarkFalsePositive(post.id)}
                    onApprove={() => handleApprovePost(post.id)}
                    onReject={() => handleRejectPost(post.id)}
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
