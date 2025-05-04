// WebSocket event types and interfaces for type safety
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type Post = {
  id: string;
  file: string;
  type: "image" | "text";
  userId?: string;
  username?: string;
  reviewed: boolean;
  createdAt: string;
};

// Socket.io server instance type
export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

// Socket events for communication
export enum SOCKET_EVENTS {
  NEW_POST = "new-post",
  POST_REMOVED = "post-removed",
  POST_REVIEWED = "post-reviewed",
  POSTS_UPDATE = "posts-update",
  JOIN_ROOM = "join-room",
  LEAVE_ROOM = "leave-room",
}

// Client room types
export enum CLIENT_ROOMS {
  ADMIN = "admin",
  USER = "user",
}
