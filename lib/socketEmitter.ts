// Helper functions for emitting events to clients from anywhere in the application
import { CLIENT_ROOMS, SOCKET_EVENTS, Post } from "./socket";
import { Server as SocketIOServer } from "socket.io";

// Global reference to store the Socket.IO instance
let ioInstance: SocketIOServer | null = null;

// Set the Socket.IO instance (should be called from the socketio.ts API route)
export const setSocketInstance = (io: SocketIOServer) => {
  ioInstance = io;
};

// Get the Socket.IO instance
export const getSocketInstance = (): SocketIOServer | null => {
  return ioInstance;
};

// Helper function to emit a new post event
export const emitNewPost = (post: Post) => {
  const io = getSocketInstance();
  if (!io) {
    console.warn("Socket.IO instance not available for emitting new post");
    return;
  }

  // Emit to admin room
  io.to(CLIENT_ROOMS.ADMIN).emit(SOCKET_EVENTS.NEW_POST, post);
  // Emit to user room
  io.to(CLIENT_ROOMS.USER).emit(SOCKET_EVENTS.NEW_POST, post);
};

// Helper function to emit a post removal event
export const emitPostRemoved = (postId: string) => {
  const io = getSocketInstance();
  if (!io) {
    console.warn("Socket.IO instance not available for emitting post removal");
    return;
  }

  // Emit to all clients
  io.emit(SOCKET_EVENTS.POST_REMOVED, postId);
};

// Helper function to emit a post reviewed event
export const emitPostReviewed = (postId: string) => {
  const io = getSocketInstance();
  if (!io) {
    console.warn("Socket.IO instance not available for emitting post review");
    return;
  }

  // Emit to all clients
  io.emit(SOCKET_EVENTS.POST_REVIEWED, postId);
};
