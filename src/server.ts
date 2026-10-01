import "dotenv/config";
import { createServer } from "node:http";

import app from "./app.js";
import { initSocket } from "./realtime/socket.js";

const PORT = Number(process.env.PORT) || 4000;

const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});