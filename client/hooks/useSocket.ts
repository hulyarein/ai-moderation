"use client";

// Client-side Socket.IO implementation for Next.js App Router
import { Socket, io } from "socket.io-client";
import { useEffect, useState } from "react";
import { SOCKET_EVENTS, CLIENT_ROOMS, Post } from "@/lib/socket";

// In-memory socket instance for reuse across client components
let socketInstance: Socket | null = null;

export const useSocket = (roomType: keyof typeof CLIENT_ROOMS) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  useEffect(() => {
    if (!socketInstance) {
      // Create a new socket instance if it doesn't exist
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? `${protocol}//${host}`
          : "http://localhost:3000";

      socketInstance = io(baseUrl, {
        path: "/api/socketio",
        addTrailingSlash: false,
        transports: ["websocket", "polling"], // Prefer WebSocket, fallback to polling
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    // Setup socket event handlers
    const onConnect = () => {
      console.log("Socket connected");
      setIsConnected(true);

      // Join specific room based on client type
      const room = CLIENT_ROOMS[roomType];
      socketInstance?.emit(SOCKET_EVENTS.JOIN_ROOM, room);
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };

    const onError = (err: Error) => {
      console.error("Socket error:", err);
      setLastError(err);
      setIsConnected(false);
    };

    // Register event handlers
    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("connect_error", onError);

    // Connect if not already connected
    if (!socketInstance.connected) {
      socketInstance.connect();
    } else {
      setIsConnected(true);
      // Join room if already connected
      const room = CLIENT_ROOMS[roomType];
      socketInstance.emit(SOCKET_EVENTS.JOIN_ROOM, room);
    }

    // Store socket instance in component state
    setSocket(socketInstance);

    // Cleanup function
    return () => {
      // Leave room before cleanup
      const room = CLIENT_ROOMS[roomType];
      socketInstance?.emit(SOCKET_EVENTS.LEAVE_ROOM, room);

      // Remove event listeners
      socketInstance?.off("connect", onConnect);
      socketInstance?.off("disconnect", onDisconnect);
      socketInstance?.off("connect_error", onError);

      // Note: We don't disconnect the socket here to preserve it across components
      // The socket will be disconnected when the app is closed
    };
  }, [roomType]);

  // Function to emit new post event
  const emitNewPost = (post: Post) => {
    if (socket && isConnected) {
      socket.emit(SOCKET_EVENTS.NEW_POST, post);
    } else {
      console.warn("Socket not connected, cannot emit new post event");
    }
  };

  // Function to emit post removed event
  const emitPostRemoved = (postId: string) => {
    if (socket && isConnected) {
      socket.emit(SOCKET_EVENTS.POST_REMOVED, postId);
    } else {
      console.warn("Socket not connected, cannot emit post removed event");
    }
  };

  // Function to emit post reviewed event
  const emitPostReviewed = (postId: string) => {
    if (socket && isConnected) {
      socket.emit(SOCKET_EVENTS.POST_REVIEWED, postId);
    } else {
      console.warn("Socket not connected, cannot emit post reviewed event");
    }
  };

  return {
    socket,
    isConnected,
    lastError,
    emitNewPost,
    emitPostRemoved,
    emitPostReviewed,
  };
};
