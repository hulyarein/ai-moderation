// Socket.IO middleware for Next.js
import type { NextApiRequest } from "next";
import { NextApiResponseWithSocket } from "./socket";

/**
 * Socket.IO middleware for Next.js API routes
 * This ensures that all API routes can access the socket server if needed
 */
export default function socketMiddleware(
  handler: (
    req: NextApiRequest,
    res: NextApiResponseWithSocket
  ) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponseWithSocket) => {
    // Forward the request to the handler
    return handler(req, res);
  };
}
