import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
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

export const emitPostKudosUpdated = (
  postId: string,
  kudosCount: number,
) => {
  getSocket().emit("post:kudos-updated", {
    postId,
    kudosCount,
  });
};