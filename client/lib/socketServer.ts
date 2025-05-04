// Server-side implementation of WebSocket using Socket.IO
import { Server as SocketIOServer } from "socket.io";
import {
  CLIENT_ROOMS,
  SOCKET_EVENTS,
  NextApiResponseWithSocket,
} from "./socket";
import { detectToxicPosts, detectDeepfakeImages } from "./database";

// Global interval reference for automated moderation
let moderationInterval: NodeJS.Timeout | null = null;
let isModeratorPaused = false;
let lastCheckTime = new Date();
const CHECK_INTERVAL = 60000; // 1 minute in milliseconds

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

    // Handle pause/resume requests
    socket.on(SOCKET_EVENTS.TOGGLE_MODERATION, (pauseState: boolean) => {
      if (socket.rooms.has(CLIENT_ROOMS.ADMIN)) {
        isModeratorPaused = pauseState;
        io.to(CLIENT_ROOMS.ADMIN).emit(SOCKET_EVENTS.MODERATION_STATUS_UPDATE, {
          isPaused: isModeratorPaused,
        });
        console.log(
          `Automated moderation ${
            isModeratorPaused ? "paused" : "resumed"
          } by admin`
        );
      }
    });
  });

  // Start the automated content moderation if not already running
  startAutomatedModeration(io);

  // Set up interval to broadcast the time remaining until next check
  setInterval(() => {
    if (io && moderationInterval && !isModeratorPaused) {
      const now = new Date();
      const elapsedSinceLastCheck = now.getTime() - lastCheckTime.getTime();
      const remainingTime = Math.max(0, CHECK_INTERVAL - elapsedSinceLastCheck);
      const secondsRemaining = Math.ceil(remainingTime / 1000);

      io.to(CLIENT_ROOMS.ADMIN).emit(SOCKET_EVENTS.MODERATION_TIMER_UPDATE, {
        secondsRemaining,
        isActive: true,
      });
    } else if (io) {
      // If paused, just emit the paused status
      io.to(CLIENT_ROOMS.ADMIN).emit(SOCKET_EVENTS.MODERATION_TIMER_UPDATE, {
        secondsRemaining: 0,
        isActive: false,
      });
    }
  }, 1000); // Update every second

  console.log("Socket server initialized");
  return io;
};

// Setup automated content moderation that runs every minute
export const startAutomatedModeration = (io: SocketIOServer) => {
  // Only start if not already running
  if (moderationInterval) {
    console.log("Automated moderation already running");
    return;
  }

  console.log("Starting automated content moderation (1-minute interval)");
  isModeratorPaused = false;

  // Run the moderation check immediately on startup
  runModerationCheck(io);
  lastCheckTime = new Date();

  // Then set up the interval for every minute (60000 ms)
  moderationInterval = setInterval(() => {
    if (!isModeratorPaused) {
      runModerationCheck(io);
      lastCheckTime = new Date();
    }
  }, CHECK_INTERVAL);
};

// Stop the automated moderation if needed
export const stopAutomatedModeration = () => {
  if (moderationInterval) {
    clearInterval(moderationInterval);
    moderationInterval = null;
    console.log("Automated content moderation stopped");
  }
};

// Function to run the actual moderation checks
async function runModerationCheck(io: SocketIOServer) {
  console.log("Running automated content moderation check...");

  // Notify admins that a scan has started
  io.to(CLIENT_ROOMS.ADMIN).emit(SOCKET_EVENTS.MODERATION_SCAN_STARTED, {
    timestamp: new Date(),
    message: "Automated content moderation scan started",
  });

  try {
    // Check for toxic text posts
    const toxicResult = await detectToxicPosts();

    // Check for deepfake images
    const deepfakeResult = await detectDeepfakeImages();

    // Log results for monitoring
    console.log(
      `Moderation check completed: Found ${
        toxicResult.toxic || 0
      } toxic posts and ${deepfakeResult.deepfakes || 0} potential deepfakes`
    );

    // If the moderation found harmful content, notify admin room
    if (
      (toxicResult.toxic && toxicResult.toxic > 0) ||
      (deepfakeResult.deepfakes && deepfakeResult.deepfakes > 0)
    ) {
      io.to(CLIENT_ROOMS.ADMIN).emit(SOCKET_EVENTS.MODERATION_ALERT, {
        timestamp: new Date(),
        toxicPosts: toxicResult.toxic || 0,
        deepfakeImages: deepfakeResult.deepfakes || 0,
        total: (toxicResult.toxic || 0) + (deepfakeResult.deepfakes || 0),
      });
    }
  } catch (error) {
    console.error("Error during automated moderation check:", error);
  }

  // Reset the timer after the check completes
  lastCheckTime = new Date();
}

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
