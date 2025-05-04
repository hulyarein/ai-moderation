// Server-side implementation of WebSocket using Socket.IO
import { Server as SocketIOServer } from "socket.io";
import {
  CLIENT_ROOMS,
  SOCKET_EVENTS,
  NextApiResponseWithSocket,
} from "./socket";

// Initialize WebSocket server if it doesn't exist
export const initSocketServer = (res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log("Socket server already initialized");
    return res.socket.server.io;
  }

  console.log("Initializing socket server...");
  const io = new SocketIOServer(res.socket.server, {
    path: "/api/socket",
    // Add any additional configuration here
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store the socket server instance
  res.socket.server.io = io;

  // Setup connection handler
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle client joining a room (admin or user)
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (room: CLIENT_ROOMS) => {
      // Validate the room type
      if (Object.values(CLIENT_ROOMS).includes(room)) {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
      }
    });

    // Handle client leaving a room
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (room: CLIENT_ROOMS) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  console.log("Socket server initialized");
  return io;
};

// Helper function to emit events to specific rooms
export const emitToRoom = (
  io: SocketIOServer,
  room: CLIENT_ROOMS,
  event: SOCKET_EVENTS,
  data: any
) => {
  io.to(room).emit(event, data);
};

// Helper function to emit events to all connected clients
export const emitToAll = (
  io: SocketIOServer,
  event: SOCKET_EVENTS,
  data: any
) => {
  io.emit(event, data);
};
