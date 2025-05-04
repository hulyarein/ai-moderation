// Server setup for Socket.IO with Next.js
import { Server } from "socket.io";
import { CLIENT_ROOMS, SOCKET_EVENTS, Post } from "@/lib/socket";
import { NextApiRequest } from "next";
import { NextApiResponseWithSocket } from "@/lib/socket";
import { setSocketInstance } from "@/lib/socketEmitter";

// Global Socket.IO instance
let io: Server;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  // Check if Socket.IO is already initialized
  if (res.socket.server.io) {
    console.log("Socket.IO is already running");
    io = res.socket.server.io;
    res.end();
    return;
  }

  console.log("Initializing Socket.IO server...");
  io = new Server(res.socket.server, {
    path: "/api/socketio",
    addTrailingSlash: false,
    // Enable CORS for all origins in development
    // In production, you might want to restrict this
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://ai-moderation.vercel.app').origin
        : "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Configure transports - important for Vercel
    transports: ['websocket', 'polling'],
  });

  // Store the socket.io server instance for access from anywhere
  setSocketInstance(io);

  // Set up event handlers
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join room handler
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (room: CLIENT_ROOMS) => {
      if (Object.values(CLIENT_ROOMS).includes(room)) {
        socket.join(room);
        console.log(`Client ${socket.id} joined room: ${room}`);
      }
    });

    // Leave room handler
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (room: CLIENT_ROOMS) => {
      socket.leave(room);
      console.log(`Client ${socket.id} left room: ${room}`);
    });

    // New post handler
    socket.on(SOCKET_EVENTS.NEW_POST, (post: Post) => {
      console.log(`New post received: ${post.id}`);

      // Broadcast to all clients in specified rooms
      io.to(CLIENT_ROOMS.ADMIN).emit(SOCKET_EVENTS.NEW_POST, post);
      io.to(CLIENT_ROOMS.USER).emit(SOCKET_EVENTS.NEW_POST, post);
    });

    // Post removed handler
    socket.on(SOCKET_EVENTS.POST_REMOVED, (postId: string) => {
      console.log(`Post removed: ${postId}`);

      // Broadcast to all clients
      io.emit(SOCKET_EVENTS.POST_REMOVED, postId);
    });

    // Post reviewed handler
    socket.on(SOCKET_EVENTS.POST_REVIEWED, (postId: string) => {
      console.log(`Post reviewed: ${postId}`);

      // Broadcast to all clients
      io.emit(SOCKET_EVENTS.POST_REVIEWED, postId);
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Store the Socket.IO instance on the server
  res.socket.server.io = io;

  // Respond to handshake request
  res.end();
}

// Disable body parsing for WebSocket upgrade
export const config = {
  api: {
    bodyParser: false,
  },
};
