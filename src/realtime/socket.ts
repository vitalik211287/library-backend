import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const jwtSecret = process.env.JWT_SECRET;

    if (!token || !jwtSecret) {
      next(new Error("Unauthorized"));
      return;
    }

    try {
      const payload = jwt.verify(token, jwtSecret) as {
        userId: string;
      };

      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;

    socket.join(`user:${userId}`);

    console.log(`Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getSocket = () => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  return io;
};

export const emitNotificationNew = (userId: string) => {
  getSocket().to(`user:${userId}`).emit("notification:new");
};

export const emitPostKudosUpdated = (
  postId: string,
  kudosCount: number,
) => {
  getSocket().emit("post:kudos-updated", {
    postId,
    kudosCount,
  });
};